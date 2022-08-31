import type { VercelRequest, VercelResponse } from '@vercel/node';

import { adminClient } from '../../../../api-lib/gql/adminClient';
import { errorResponseWithStatusCode } from '../../../../api-lib/HttpError';
import { verifyHasuraRequestMiddleware } from '../../../../api-lib/validate';
import {
  deleteContributionInput,
  composeHasuraActionRequestBody,
} from '../../../../src/lib/zod';

async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('test');
  const {
    session_variables: { hasuraAddress: address },
    input: { payload },
  } = composeHasuraActionRequestBody(deleteContributionInput).parse(req.body);

  const { contribution_id } = payload;
  const { contributions_by_pk: contribution } = await adminClient.query(
    {
      contributions_by_pk: [
        { id: contribution_id },
        {
          deleted_at: true,
          epoch: [
            {},
            {
              ended: true,
            },
          ],
          user: [
            {},
            {
              address: true,
            },
          ],
        },
      ],
    },
    { operationName: 'deleteContribution_getContributionDetails' }
  );

  if (
    !contribution ||
    contribution?.deleted_at ||
    contribution?.user?.address !== address
  ) {
    errorResponseWithStatusCode(
      res,
      { message: 'contribution does not exist' },
      422
    );
    return;
  }

  if (contribution?.epoch?.ended) {
    errorResponseWithStatusCode(
      res,
      { message: 'contribution attached to an ended epoch is not editable' },
      422
    );
    return;
  }

  await adminClient.mutate(
    {
      update_contributions_by_pk: [
        { pk_columns: { id: contribution_id }, _set: { deleted_at: 'now()' } },
        { __typename: true },
      ],
    },
    { operationName: 'deleteContribution_delete' }
  );

  res.status(200).json({
    success: true,
  });
}

export default verifyHasuraRequestMiddleware(handler);
