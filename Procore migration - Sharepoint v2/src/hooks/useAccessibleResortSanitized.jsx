import { useLocalStorage } from '@uidotdev/usehooks';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useRenewToken from './useRenewToken';
import { LOCAL_STORAGE_KEYS } from '../const/common';

export default function useAccessibleResortsSanitized({
  accessibleResorts = [],
  loginName = null,
}) {
  const { getAccessToken } = useRenewToken();
  const [localResorts, setLocalResorts] = useLocalStorage(
    LOCAL_STORAGE_KEYS.ACCESSIBLE_RESORTS_WITH_EDIT,
    [],
  );

  const createHeaders = (token) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=verbose;charset=utf-8',
    },
    maxBodyLength: Infinity,
  });

  const checkAccess = async (siteName, siteUrl, token) => {
    const [groupsRes, adminRes] = await Promise.all([
      axios.get(`${siteUrl}/_api/web/currentuser/groups`, createHeaders(token)),
      axios.get(
        `${siteUrl}/_api/web/currentuser?$select=*,IsShareByEmailGuestUser`,
        createHeaders(token),
      ),
    ]);

    const groups = groupsRes?.data?.value || [];
    const targetGroups = [`${siteName} owners`, `${siteName} members`].map(
      (g) => g.toLowerCase(),
    );
    const isInGroup = groups.some((g) =>
      targetGroups.includes(g?.Title?.toLowerCase()),
    );
    const isAdmin =
      adminRes?.data?.IsSiteAdmin && !adminRes?.data?.IsShareByEmailGuestUser;

    return isInGroup || isAdmin;
  };

  const fetchSanitizedResorts = async () => {
    if (!loginName || !accessibleResorts.length) return [];

    const token = await getAccessToken();
    const results = await Promise.all(
      accessibleResorts.map(async ({ Sitename, SiteURL }) => {
        const hasAccess = await checkAccess(Sitename, SiteURL, token);
        return hasAccess ? { Sitename, SiteURL } : null;
      }),
    );

    // Deduplicate and filter nulls
    const uniqueResort = results
      .filter(Boolean)
      .filter(
        (resort, index, self) =>
          self.findIndex((r) => r?.Sitename === resort?.Sitename) === index,
      );

    setLocalResorts(uniqueResort);
    return uniqueResort;
  };

  const { data: accessibleResortsSanitized = [] } = useQuery({
    queryKey: ['accessible-resorts', accessibleResorts, loginName],
    queryFn: fetchSanitizedResorts,
    enabled: !!loginName && accessibleResorts.length > 0,
    initialData: localResorts,
  });

  return {
    accessibleResortsSanitized,
  };
}
