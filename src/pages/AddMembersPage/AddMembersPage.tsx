/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { LoadingModal } from '../../components';
import { Box } from '../../ui/Box/Box';
import { useSelectedCircle } from 'recoilState/app';
import { AppLink, Button, Flex, Panel, Text, TextField } from 'ui';
import { SingleColumnLayout } from 'ui/layouts';
import {
  deleteMagicToken,
  deleteWelcomeToken,
  useMagicToken,
  useWelcomeToken,
} from './useCircleTokens';
import { ICircle } from '../../types';
import EthAndNameEntry from './NewMemberEntry';
import CopyCodeTextField from './CopyCodeTextField';
import TabButton, { Tab } from './TabButton';
import NewMemberList from './NewMemberList';
import { client } from '../../lib/gql/client';
import { useApeSnackbar } from '../../hooks';
import { normalizeError } from '../../utils/reporting';
import { WorkingIcon } from '../../ui/icons/WorkingIcon';
import { hostname } from 'os';
import { APP_URL } from '../../utils/domain';
import isFeatureEnabled from '../../config/features';
import BackButton from '../../ui/BackButton';
import { paths } from '../../routes/paths';

export type NewMember = {
  address: string;
  name: string;
};

const AddMembersPage = () => {
  // const { isMobile } = useMobileDetect();
  const {
    circleId,
    // myUser: me,
    // users: visibleUsers,
    circle,
    // circleEpochsStatus: { epochs: epochsReverse },
  } = useSelectedCircle();

  const [loading, setLoading] = useState<boolean>(false);

  const { data: magicLinkUuid, refetch: refetchMagicToken } =
    useMagicToken(circleId);
  const { data: welcomeUuid, refetch: refetchWelcomeToken } =
    useWelcomeToken(circleId);

  // Wait for initial load, show nothing but loading modal
  if (!magicLinkUuid || !welcomeUuid) {
    return <LoadingModal visible={true} />;
  }

  const revokeMagic = async () => {
    try {
      setLoading(true);
      await deleteMagicToken(circleId);
      await refetchMagicToken();
    } finally {
      setLoading(false);
    }
  };

  const revokeWelcome = async () => {
    try {
      setLoading(true);
      await deleteWelcomeToken(circleId);
      await refetchWelcomeToken();
    } finally {
      setLoading(false);
    }
  };

  // TODO: handle the hostname for local /staging
  const magicLink = APP_URL + '/join/' + magicLinkUuid;
  const welcomeLink = APP_URL + '/welcome/' + welcomeUuid;

  return (
    <>
      <LoadingModal visible={loading} />
      <AddMembersContents
        circle={circle}
        welcomeLink={welcomeLink}
        magicLink={magicLink}
        revokeMagic={revokeMagic}
        revokeWelcome={revokeWelcome}
      />
    </>
  );
};

const AddMembersContents = ({
  circle,
  welcomeLink,
  magicLink,
  revokeMagic,
  revokeWelcome,
}: {
  circle: ICircle;
  welcomeLink: string;
  magicLink: string;
  revokeMagic(): void;
  revokeWelcome(): void;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.ETH);
  const [success, setSuccess] = useState<boolean>(false);

  return (
    <SingleColumnLayout>
      {loading && <LoadingModal visible={true} />}

      <Box>
        <AppLink to={paths.members(circle.id)}>
          <BackButton />
        </AppLink>
      </Box>

      <Flex css={{ alignItems: 'center', mb: '$sm' }}>
        <Text h1>Add Members to {circle.name}</Text>
      </Flex>
      <Box css={{ mb: '$md' }}>
        <Text>
          Note that after adding members you can see and manage them in
          the&nbsp;
          <AppLink to={paths.members(circle.id)}>members table.</AppLink>
        </Text>
      </Box>
      {(isFeatureEnabled('csv_import') || isFeatureEnabled('link_joining')) && (
        <Flex css={{ mb: '$xl' }}>
          <TabButton
            tab={Tab.ETH}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
          >
            Add by ETH Address
          </TabButton>
          {isFeatureEnabled('csv_import') && (
            <TabButton
              tab={Tab.CSV}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            >
              CSV Import
            </TabButton>
          )}
          {isFeatureEnabled('link_joining') && (
            <TabButton
              tab={Tab.LINK}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            >
              Join Link
            </TabButton>
          )}
        </Flex>
      )}
      <Panel>
        {currentTab === Tab.ETH && (
          <Box>
            <Text css={{ pb: '$xl' }} size={'large'}>
              Only members on this list can join. TODO tweak this Idk
            </Text>

            <NewMemberList
              circleId={circle.id}
              welcomeLink={welcomeLink}
              revokeWelcome={revokeWelcome}
            />
            {success && (
              <Box>
                WelcomeLink
                <Flex>
                  <Box css={{ flexGrow: 1, mr: '$md' }}>
                    <CopyCodeTextField value={welcomeLink} />
                  </Box>
                  <Button
                    color={'transparent'}
                    onClick={revokeWelcome}
                    css={{ padding: 0 }}
                  >
                    {/* TODO this styling is not lovely */}
                    <WorkingIcon size="md" color="neutral" />
                  </Button>
                </Flex>
              </Box>
            )}
          </Box>
        )}
        {currentTab === Tab.CSV && (
          <Box>
            <Box>CSV Import</Box>
          </Box>
        )}
        {currentTab === Tab.LINK && (
          <>
            <div>
              MagicLink
              <CopyCodeTextField value={magicLink} />
              <Button onClick={revokeMagic}>refr</Button>
            </div>
          </>
        )}
      </Panel>
    </SingleColumnLayout>
  );
};

export default AddMembersPage;