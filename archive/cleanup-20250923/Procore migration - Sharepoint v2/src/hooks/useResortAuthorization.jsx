import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../const/common';
import { useLocalStorage } from '@uidotdev/usehooks';
import useRenewToken from './useRenewToken';

// Custom hook to check if user is part of owners or admins
export const useUserSiteAuthorization = ({ siteName }) => {
  const { getAccessToken } = useRenewToken();
  const [accessibleResorts] = useLocalStorage(
    LOCAL_STORAGE_KEYS.ACCESSIBLE_RESORTS,
    [],
  );

  const siteUrl = useMemo(() => {
    if (!accessibleResorts.length || !siteName) {
      return null;
    }

    return accessibleResorts.find(
      (resort) => resort.Sitename.toLowerCase() === siteName.toLowerCase(),
    )?.SiteURL;
  }, [accessibleResorts, siteName]);

  // Common error handler for unauthorized access
  const handleUnauthorized = (status) => {
    if (status === 401) {
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/';
      }, 1000);
    }
  };

  // Query to check if the user is a site admin
  const userInfoQuery = useQuery({
    queryKey: ['currentUser', siteUrl],
    enabled: !!siteUrl,
    queryFn: async () => {
      const response = await axios.get(
        `${siteUrl}/_api/web/currentuser?$select=*,IsShareByEmailGuestUser`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: 'application/json;',
          },
        },
      );

      return response.data;
    },
    onError: (error) => {
      handleUnauthorized(error?.status);
    },
    retry: 1,
  });

  // Query to check if the user is part of the site owners group
  const userGroupsQuery = useQuery({
    queryKey: ['userGroups', siteUrl, siteName],
    enabled: !!siteUrl,
    queryFn: async () => {
      const response = await axios.get(
        `${siteUrl}/_api/web/currentuser/groups`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: 'application/json;',
          },
        },
      );

      return response.data;
    },
    onError: (error) => {
      handleUnauthorized(error?.status);
    },
  });

  // Calculate isAutoApproveAvailable based on both queries
  const isAutoApproveAvailable = useMemo(() => {
    // Check if user is a site admin
    const isSiteAdmin = userInfoQuery.data?.IsSiteAdmin === true;

    // Check if user is in the owners group
    const isOwner = userGroupsQuery.data?.value?.some(
      (group) =>
        group.Title.toLowerCase() === `${siteName?.toLowerCase()} owners`,
    );

    return isSiteAdmin || isOwner;
  }, [userInfoQuery.data, userGroupsQuery.data, siteName]);

  // Calculate combined loading state
  const isLoading = userInfoQuery.isLoading || userGroupsQuery.isLoading;

  // Calculate combined error state
  const error = userInfoQuery.error || userGroupsQuery.error;
  const errorMessage = error
    ? error.response?.data?.error?.message?.value || 'Something went wrong'
    : '';

  return {
    isAutoApproveAvailable,
    isLoading,
    errorMessage,
    userInfo: userInfoQuery.data,
    userGroups: userGroupsQuery.data?.value || [],
  };
};
