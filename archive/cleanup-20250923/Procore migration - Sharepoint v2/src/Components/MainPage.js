import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { debounce } from 'lodash';
import Alert from '@mui/material/Alert';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import axios from 'axios';
import Grid from '@mui/material/Grid2';
import Grid1 from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsIcon from '@mui/icons-material/Settings';
import DmsUploadPage from './_UploadPage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Chip from '@mui/material/Chip';
import { PropertyContext } from '../context/PropertyProvider';
import useShowModal from '../hooks/useShowModal';
import CustomNavigation from '../Components/_Navigation';
import DataFilterItem from '../ui/main/DataFilterItem';
import CollapsableSidebar from '../ui/main/CollapsableSidebar';
import SmallScreenMenus from '../ui/main/SmallScreenMenus';
import useRenewToken from '../hooks/useRenewToken';
import { WarningDialog } from '../ui/main/WarningDialog';
import { BulkUploadDialog } from './upload/bulk-upload-dialog';
import { useNavigate, useParams } from 'react-router-dom';
import { getFileID } from '../apis/services/viewServices';
import { formatUniqueId, getKeyValue, normalizeCells } from '../utils/helpers';
import { BulkDownloadBar } from './bulk-download/bar';
import { useBulkUploadStore } from './upload/bulk-upload-store';
import { BulkDownloadModal } from './bulk-download/modal';
import { useBulkDownload } from '../hooks/useBulkDownload';
import { UploadFile } from '@mui/icons-material';
import { Snackbar } from '@mui/material';
import {
  autoApproveFolder,
  createCheckSharepointFolderIfExist,
  moveFileToFolder,
} from './upload/services';
import { checkForAutoApproval } from '../apis/services/viewServices';
import { orderBy } from 'natural-orderby';
import { useSplitDrawing } from '../hooks/useSplitDrawing';
import { TERMS_KEY_MAPPING_CT } from '../const/common';
import { useApprovalStore } from '../store/approval-store';
import { useShallow } from 'zustand/react/shallow';
import useAccessibleResortsSanitized from '../hooks/useAccessibleResortSanitized';
import { FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE } from '../const/common';
import naturalCompare from 'natural-compare-lite';

// import termsData from '../Data/terms.json';
const termsData_ = await import(
  `../Data/terms-${process.env.REACT_APP_ENV}.json`
);
const termsData = termsData_?.default;
// import termsMapData from '../Data/termKeyMapping.json';
const termsMapData_ = await import(
  `../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

const termsMapCTData_ = await import(
  `../Data/termKeyMappingCT-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTData = termsMapCTData_?.default;

const versionFileStatusMapping_ = await import(
  `../Data/versionFileStatusMapping.json`
);
const versionFileStatusMapping = versionFileStatusMapping_?.default;

const MainPage = () => {
  const { snackbar, setSnackbar } = useApprovalStore(
    useShallow((state) => ({
      snackbar: state.snackbar,
      setSnackbar: state.setSnackbar,
    })),
  );
  const { setCaptureResponse } = useContext(PropertyContext);
  const [isAuth, setIsAuth] = useState(false);
  const [isInprogress, setInprogress] = useState(false);
  const [isError, setIsError] = useState('');
  const [response, setResponse] = useState([]);
  const [responseTmp, setResponseTmp] = useState([]);

  const theme = useTheme();
  const params = useParams();

  const {
    bulkDownloadByKey,
    modalOpen,
    setModalOpen,
    modalContent,
    modalActions,
    downloadableStatus,
  } = useBulkDownload();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Page Specific
  const [filter, setFilter] = useState({});
  const [filterGroup, setFilterGroup] = useState({});
  const [filterNullOveride, setFilterNullOveride] = useState([]);
  const [grouping, setGrouping] = useState('Drawing Area');
  const searchTextInput = useRef(null);
  const [isSearchCriteriaVisible, setIsSearchCriteriaVisible] = useState(true);
  const [searchConfigs, setSearchConfigs] = useState([]);
  const [selectedSavedConfig, setSelectedSavedConfig] = useState(null);

  const [isSavedSearchConfigOpen, setIsSavedSearchConfigOpen] = useState(false);
  const savedSearchConfigNameTextInput = useRef(null);
  const [savedSearchConfigNameText, setSavedSearchConfigNameText] =
    useState(null);
  const [isSavedSearchConfigType, setIsSavedSearchConfigType] = useState('');
  const [isInProgressSavingConfig, setIsInProgressSavingConfig] =
    useState(false);
  const [isNewConfigType, setIsNewConfigType] = useState(true);

  const [expandedFilter, setExpandedFilter] = useState([]);

  const searchFileNameTextInput = useRef(null);
  const [searchFileName, setSearchFileName] = useState(null);

  const [isSavedFilterModified, setIsSavedFilterModified] = useState(false);

  const [authBarView, setAuthBarView] = useState(true);

  const [searchFileNameTextInputFocused, setSearchFileNameTextInputFocused] =
    useState(false);

  const [savedFilterConfigCurDefault, setSavedFilterConfigCurDefault] =
    useState(false);

  const [accessibleResorts, setAccessibleResorts] = useState([]);
  const [termsDataLocal, setTermsDataLocal] = useState({});

  const [isMinorVersionListOpen, setIsMinorVersionListOpen] = useState(false);
  const [isInProgressMinorVersionList, setIsInProgressMinorVersionList] =
    useState(false);
  const [minorVersions, setMinorVersions] = useState([]);
  const [minorVersionsRaw, setMinorVersionsRaw] = useState([]);
  const [minorVersionsNextUrl, setMinorVersionsNextUrl] = useState(null);
  const [isAdminFilter, setIsAdminFilter] = useState(false);
  const [IsShareByEmailGuestUserObj, setIsShareByEmailGuestUserObj] =
    useState(null);
  const [minorVersionsResortTarget, setMinorVersionsResortTarget] =
    useState(null);
  const [isErrorMinorVersions, setIsErrorMinorVersions] = useState('');
  const [isMinorVersionUpdated, setIsMinorVersionUpdated] = useState(false);
  const [minorVersionIframeProp, setMinorVersionIframeProp] = useState(null);
  const [minorVersionIframePropRaw, setMinorVersionIframePropRaw] =
    useState(null);
  const [minorVersionIframeSrc, setMinorVersionIframeSrc] = useState(null);
  const [minorVersionIframeSrcTitle, setMinorVersionIframeSrcTitle] =
    useState(null);
  const [minorVersionComments, setMinorVersionComments] = useState('');
  const [isMinorVersionCommentsOpen, setIsMinorVersionCommentsOpen] =
    useState(false);

  const draftCommentTextInput = useRef(null);
  const searchMinorVersionTextInput = useRef(null);
  const [searchMinorVersion, setSearchMinorVersion] = useState('');

  const [userType, setUserType] = useState(0); // 0 = guest | 1 = normal user | 2 = admin
  const [loginName, setLoginName] = useState(null);
  const { accessibleResortsSanitized } = useAccessibleResortsSanitized({
    accessibleResorts,
    loginName,
  });

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // approval page table sort
  const [approvalPageTableOrder, setapprovalPageTableOrder] = useState('asc');
  const [approvalPageTableOrderBy, setapprovalPageTableOrderBy] =
    useState('Modified');

  const [noticeSnackIsOpen, setNoticeSnackIsOpen] = useState(false);
  const [noticeSnackMsg, setNoticeSnackMsg] = useState('');

  const [minorFilter, setMinorFilter] = useState([]);

  const prevSlug = useRef(null);

  // Approval Page fetch pro approval / draft call controller
  const controllerDraftApprovalFetchsRef = useRef(new Map());

  const handleSortApprovalPageTable = (property) => {
    const isAsc =
      approvalPageTableOrderBy === property && approvalPageTableOrder === 'asc';
    setapprovalPageTableOrder(isAsc ? 'desc' : 'asc');
    setapprovalPageTableOrderBy(property);
  };

  const { getAccessToken } = useRenewToken();

  const sortedData = [...minorVersions].sort((a, b) => {
    // if (a[approvalPageTableOrderBy] < b[approvalPageTableOrderBy]) return approvalPageTableOrder === "asc" ? -1 : 1;
    // if (a[approvalPageTableOrderBy] > b[approvalPageTableOrderBy]) return approvalPageTableOrder === "asc" ? 1 : -1;
    // return 0;
    const valA = a[approvalPageTableOrderBy] ?? ''; // Default to empty string if undefined
    const valB = b[approvalPageTableOrderBy] ?? ''; // Default to empty string if undefined

    if (typeof valA === 'string' && typeof valB === 'string') {
      return approvalPageTableOrder === 'asc'
        ? valA.localeCompare(valB, 'en', { sensitivity: 'base' })
        : valB.localeCompare(valA, 'en', { sensitivity: 'base' });
    }

    return approvalPageTableOrder === 'asc' ? valA - valB : valB - valA;
  });

  // Auth ---
  const [isMessageReceived, setIsMessageReceived] = useState(null);
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== `${process.env.REACT_APP_CCT_URL}`) return;
      const postMsg = JSON.parse(event.data);
      Object.keys(postMsg).forEach((key) => {
        localStorage.setItem(key, postMsg[key]);
      });
      setIsMessageReceived(true);
    };
    window.addEventListener('message', handleMessage);

    setTimeout(() => {
      if (isMessageReceived === null) {
        authCheck();
        setInprogress(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const setFilterStore = useBulkUploadStore((state) => state.setFilter);

  useEffect(() => {
    setFilterStore(filter ?? {});
  }, [filter]);

  useEffect(() => {
    if (!isMessageReceived) return; // Wait until message is received
    authCheck();
  }, [isMessageReceived]);

  const authCheck = async () => {
    const authToken = await getAccessToken(true);
    if (authToken !== null) {
      setIsAuth(authToken);
      setTimeout(() => {
        setAuthBarView(false);
      }, 1000);
    } else {
      setIsError('Unauthorized access. Redirecting to landing page...');
      // if (params?.docId && window.location.pathname.includes('/view')) {
      //   navigate(`/?viewId=${encodeURIComponent(`${params?.docId}`)}`);
      // } else {
      //   navigate('/');
      // }
    }
  };
  // Auth ---

  const guestUserCheck = async () => {
    axios
      .get(
        `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com/sites/${process.env.REACT_APP_HUB_NAME}/_api/web/currentuser?$select=*,IsShareByEmailGuestUser`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
          },
          maxBodyLength: Infinity,
        },
      )
      .then((res) => {
        if (res.data.error === true) {
          setIsError(
            res?.data?.errorMessage
              ? res?.data?.errorMessage
              : 'something went wrong',
          );
        } else {
          if (res) {
            setIsError('');
            if (res.data?.IsShareByEmailGuestUser === false) {
              if (res.data?.IsSiteAdmin === true) {
                setUserType(2);
              } else {
                setUserType(1);
              }
            } else {
              setUserType(0);
            }
            setLoginName(res.data?.LoginName);
          } else {
            setIsError('Search error - unable to fetch user type.');
          }
        }
      })
      .catch((e) => {
        setIsError(
          e?.response?.data?.['odata.error']?.message?.value ??
            'something went wrong',
        );
        if (e.status === 401) {
          localStorage.clear();
          window.location.href = '/';
        } else if (e.status === 403) {
          setIsError(
            'You do not have access rights to any resort, please contact appsupport@gemlife.com.au and copy your resort representative in the email.',
          );
        }
      });
  };

  const getPostQuery = async (payload) => {
    setInprogress(true);
    const accessToken = await getAccessToken();
    axios
      .post(
        `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com/sites/${process.env.REACT_APP_HUB_NAME}/_api/search/postquery`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
          },
          maxBodyLength: Infinity,
        },
      )
      .then((res) => {
        if (res.data.error === true) {
          setIsError(
            res?.data?.errorMessage
              ? res?.data?.errorMessage
              : 'something went wrong',
          );
        } else {
          if (res) {
            setIsError('');
            const parseAccessibleSitesRes = parseAccessibleSites(
              res.data.PrimaryQueryResult?.RelevantResults?.Table?.Rows,
            );

            // filter only accessible resorts
            const termsDataTmp = termsData['DMS Terms'];
            const filteredResorts = Object.fromEntries(
              Object.entries(termsDataTmp?.Resort).filter(([key]) =>
                parseAccessibleSitesRes.some((item) => item?.Sitename === key),
              ),
            );

            const parseAccessibleSitesRes_ = parseAccessibleSitesRes.filter(
              (item) =>
                Object.keys(termsData['DMS Terms']?.Resort).includes(
                  item.Sitename,
                ),
            );
            setAccessibleResorts(parseAccessibleSitesRes_);

            termsDataTmp.Resort = filteredResorts;
            setTermsDataLocal(termsDataTmp);

            window.localStorage.setItem(
              'accessibleResorts',
              JSON.stringify(parseAccessibleSitesRes),
            );
          } else {
            setIsError('Search error - unable to fetch sites.');
          }
        }
        setInprogress(false);
      })
      .catch((e) => {
        setInprogress(false);
        setIsError(
          e?.response?.data?.error?.message?.value
            ? e?.response?.data?.error?.message?.value
            : 'something went wrong',
        );
        if (e.status === 401) {
          setTimeout(function () {
            // localStorage.clear();
            // window.location.href = '/';
          }, 1000);
        } else if (e.status === 403) {
          setIsError(
            'You do not have access rights to any resort, please contact appsupport@gemlife.com.au and copy your resort representative in the email.',
          );
        }
      });
  };

  useEffect(() => {
    if (isAuth) {
      guestUserCheck();

      const payload = {
        request: {
          Querytext: `contentclass:STS_Site DepartmentId:{${process.env.REACT_APP_RELATEDHUBSITE}}`,
          SelectProperties: {
            results: [
              'Title',
              'Path',
              'Description',
              'SiteLogo',
              'SiteDescription',
              'SiteName',
              'SiteId',
              'WebId',
            ],
          },
          StartRow: 0,
          RowLimit: 100,
          ClientType: 'PnPModernSearch',
          __metadata: {
            type: 'Microsoft.Office.Server.Search.REST.SearchRequest',
          },
        },
      };

      if (
        window.localStorage.getItem('accessibleResorts') !== null &&
        accessibleResorts.length === 0
      ) {
        const localCacheAccessibleResorts = JSON.parse(
          window.localStorage.getItem('accessibleResorts'),
        );
        setAccessibleResorts(
          JSON.parse(window.localStorage.getItem('accessibleResorts')),
        );

        if (Object.keys(termsDataLocal).length > 0) return;

        // filter only accessible resorts
        const termsDataTmp = termsData['DMS Terms'];
        const filteredResorts = Object.fromEntries(
          Object.entries(termsDataTmp?.Resort).filter(([key]) =>
            localCacheAccessibleResorts.some(
              (accessibleResort) => accessibleResort?.Sitename === key,
            ),
          ),
        );
        termsDataTmp.Resort = filteredResorts;
        setTermsDataLocal(termsDataTmp);
      }

      if (
        accessibleResorts.length === 0 &&
        !isInprogress &&
        window.localStorage.getItem('accessibleResorts') === null
      ) {
        getPostQuery(payload);
      }

      if (
        params?.downloadKey &&
        window.location.pathname.includes('/bulk-downloads')
      ) {
        setTimeout(() => {
          const checkDownload = () => {
            bulkDownloadByKey(params.downloadKey, isAuth);
          };

          checkDownload();
        }, 1000);
      }
    }
  }, [isAuth]);

  const getByTitleItems = async () => {
    const accessToken = await getAccessToken();
    let filter = '';

    if (userType === 0) {
      filter = `?$filter=Author/Title eq '${isAuth.account.name}' or ConfigType eq 'Global'`;
    } else {
      filter = `?$filter=Author/Title eq '${isAuth.account.name}' or ConfigType eq 'Global' or ConfigType eq 'Internal'`;
    }

    axios
      .get(
        `${process.env.REACT_APP_REFDATA_URL}/web/lists/getbytitle('${process.env.REACT_APP_REFDATA_LISTNAME}')/items${filter}`,
        {
          headers: {
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
            Authorization: `Bearer ${accessToken}`,
          },
          maxBodyLength: Infinity,
        },
      )
      .then((res) => {
        if (res.data.error === true) {
          setIsError(res.data.errorMessage);
        } else {
          if (res.data) {
            setSearchConfigs(res.data?.d?.results);
          } else {
            setIsError('Config error - unable to fetch saved configs.');
          }
        }
      })
      .catch((e) => {
        setIsError(e.response.data.error.message.value);
        if (e.status === 401) {
          setTimeout(function () {
            localStorage.clear();
            window.location.href = '/';
          }, 1000);
        } else if (e.status === 403) {
          setIsError(
            'You do not have access rights to any resort, please contact appsupport@gemlife.com.au and copy your resort representative in the email.',
          );
        }
      });
  };

  useEffect(() => {
    if (isAuth) {
      getByTitleItems();
    }
    // adding isInProgressSavingConfig cause the app to re-render and refetch the filter view.
    // this will run the useEffect that responsible for setting the view to the latest default time.
  }, [isAuth, userType, isInProgressSavingConfig]);

  useEffect(() => {
    if (isAuth) {
      if (window.localStorage.getItem('setAuthBarView') !== null)
        setAuthBarView(false);

      setTimeout(() => {
        setAuthBarView(false);
        window.localStorage.setItem('setAuthBarView', '1');
      }, 3000);
    }
  }, [isAuth, isInProgressSavingConfig]);

  useEffect(() => {
    // defaulting to last saved filter
    if (searchConfigs.length > 0) {
      const sortedDefaultDate = searchConfigs.sort(
        (a, b) => new Date(a.default) - new Date(b.default),
      );

      // const hasSelectView = selectedSavedConfig !== null;

      // if (hasSelectView) {
      //   return;
      // }

      if (
        sortedDefaultDate &&
        sortedDefaultDate[sortedDefaultDate.length - 1] &&
        sortedDefaultDate[sortedDefaultDate.length - 1]?.default
      ) {
        // only set this on initial
        handleSaveFilterSelectChange({
          target: {
            value: sortedDefaultDate[sortedDefaultDate.length - 1]?.Id,
          },
        });
        setSavedFilterConfigCurDefault(
          sortedDefaultDate[sortedDefaultDate.length - 1]?.Id,
        );
      } else {
        handleSaveFilterSelectChange({
          target: { value: searchConfigs[searchConfigs.length - 1]?.Id },
        });
        setSavedFilterConfigCurDefault(
          searchConfigs[searchConfigs.length - 1]?.Id,
        );
      }
    }
  }, [searchConfigs, accessibleResorts]);

  useEffect(() => {
    if (selectedSavedConfig) {
      if (selectedSavedConfig?.ConfigType) {
        setIsSavedSearchConfigType(selectedSavedConfig?.ConfigType);
        if (userType !== 2 && selectedSavedConfig?.ConfigType !== 'Personal') {
          setIsNewConfigType(true);
        }
      }
    }
  }, [isSavedSearchConfigOpen, selectedSavedConfig, userType]);

  const collatebyResortDrawingNumber = (groupDetails) => {
    let titleGroupingSorted = {};
    for (let j = 0; j < Object.keys(groupDetails).length; j++) {
      const key = Object.keys(groupDetails)[j];
      if (!titleGroupingSorted[key]) {
        titleGroupingSorted[key] = {}; // Ensure the key exists
      }

      for (let i = 0; i < groupDetails[key].length; i++) {
        if (groupDetails[key][i] in response) {
          const {
            businessMetadata,
            resortMetadata,
            departmentMetadata,
            buildingMetadata,
            documentType,
            titleMetadata,
            drawingNumberMetadata,
            drawingAreaMetadata,
            parkStage,
          } = normalizeCells(response[groupDetails[key][i]]?.Cells);

          let customSubGroup = `${businessMetadata}-${resortMetadata}-${departmentMetadata}-${buildingMetadata}-${documentType}-${titleMetadata}-${drawingNumberMetadata}`;

          if (documentType?.toLowerCase() === 'drawing') {
            customSubGroup = `${businessMetadata}-${resortMetadata}-${departmentMetadata}-${drawingAreaMetadata}-${drawingNumberMetadata}-${parkStage}`;
          }

          if (!titleGroupingSorted[key][customSubGroup]) {
            titleGroupingSorted[key][customSubGroup] = []; // Ensure the title exists within the key
          }

          titleGroupingSorted[key][customSubGroup].push(groupDetails[key][i]);
        }
      }
    }

    return titleGroupingSorted;
  };

  const orderObjAlphabeticallyNullLast = (obj) => {
    // Step 1: Sort entries by key (alphabetically), move null values to the end
    const sortedEntries = orderBy(
      Object.entries(obj),
      [
        ([key]) => (key === 'znull' ? '~~' : key), // null last, sort by key
      ],
      ['asc'],
    );

    const sortedObj = Object.fromEntries(sortedEntries);

    // Step 2: Sort internal arrays based on revNumber (natural order)
    for (const groupKey of Object.keys(sortedObj)) {
      const titleGroup = sortedObj[groupKey];
      for (const titleKey of Object.keys(titleGroup)) {
        const arr = titleGroup[titleKey];

        if (Array.isArray(arr) && arr.length > 1) {
          const sortedArr = orderBy(
            arr,
            [
              (index) => {
                const revNumber = response[index]?.Cells?.[29]?.Value;
                return revNumber ?? ''; // fallback to empty string
              },
            ],
            ['desc'],
          );

          sortedObj[groupKey][titleKey] = sortedArr;
        }
      }
    }

    return sortedObj;
  };

  const orderByDrawingAreaDiciplineDrawingNumber = (obj) => {
    const objIdx = {};

    for (const [key, indexes] of Object.entries(obj)) {
      const groupedData = indexes
        .map((index) => {
          const cells = response[index]?.Cells;
          if (!cells) return null;
          const {
            businessMetadata,
            resortMetadata,
            departmentMetadata,
            buildingMetadata,
            documentType,
            drawingAreaMetadata,
            disciplineMetadata,
            drawingNumberMetadata,
          } = normalizeCells(cells);

          return {
            businessMetadata,
            resortMetadata,
            departmentMetadata,
            buildingMetadata,
            documentType,
            drawingAreaMetadata,
            disciplineMetadata,
            drawingNumberMetadata,
            index,
          };
        })
        .filter(Boolean); // remove nulls

      const sortedDataByDrawingNumber = groupedData.toSorted((a, b) =>
        naturalCompare(a.drawingNumberMetadata, b.drawingNumberMetadata),
      );

      const sortedOrderBy = orderBy(sortedDataByDrawingNumber, [
        (item) => item.businessMetadata ?? '~~',
        (item) => item.resortMetadata ?? '~~',
        (item) => item.departmentMetadata ?? '~~',
        (item) => item.buildingMetadata ?? '~~',
        (item) => item.documentType ?? '~~',
        (item) => item.drawingAreaMetadata ?? '~~',
        (item) => item.disciplineMetadata ?? '~~',
      ]);

      // Reassign sorted index list to original object
      objIdx[key] = sortedOrderBy.map((i) => i.index);
    }

    return objIdx;
  };

  useEffect(() => {
    if (response.length > 0) {
      // create vector of index
      // "Clubhouse": [0, 3, 4]
      // "Fitness Centre": [5, 6]
      // "Sales Office": [7]
      // "Summerhouse": [1, 2]
      const groupDetails = groupResponse(response, termsMapData[grouping]);

      //  Sort by Drawing Area > Sort by Dicipline > Sort by Drawing Number
      const groupDetails_ =
        orderByDrawingAreaDiciplineDrawingNumber(groupDetails);
      const withTitleLayerGrouping =
        collatebyResortDrawingNumber(groupDetails_);

      if (Object.keys(withTitleLayerGrouping).length > 0) {
        const sortedObj = orderObjAlphabeticallyNullLast(
          withTitleLayerGrouping,
        );

        setFilterGroup(sortedObj);
      }
    }
  }, [response, grouping]);

  const siteNameToSiteUrlMapping = (resortName) => {
    const siteUrlArr = accessibleResorts.filter(
      (accessibleResort) => accessibleResort.Sitename === resortName,
    );
    if (siteUrlArr.length > 0) return siteUrlArr[0]?.SiteURL;

    return;
  };

  // useEffect(() => {
  //   if (minorVersionsNextUrl != null && minorVersionsNextUrl !== '')
  //     getPendingDraftVersionsLongPull(minorVersionsNextUrl);
  // }, [minorVersionsNextUrl]);

  const cancelAllPendingDraftVersionLongPullingRequests = () => {
    controllerDraftApprovalFetchsRef.current.forEach((controller, url) => {
      controller.abort();
    });
    controllerDraftApprovalFetchsRef.current.clear(); // Clear the map after cancellation
    setMinorVersionsNextUrl(null);
  };

  const getPendingDraftVersionsLongPull = async (nextUrl) => {
    // Create new AbortController for this request
    const controllerGetPendingDraftVersionsLongPull = new AbortController();
    controllerDraftApprovalFetchsRef.current.set(
      nextUrl,
      controllerGetPendingDraftVersionsLongPull,
    );

    try {
      axios
        .get(nextUrl, {
          headers: {
            Accept: 'application/json;odata=verbose',
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          maxBodyLength: Infinity,
          signal: controllerGetPendingDraftVersionsLongPull.signal,
        })
        .then((res) => {
          if (res.data.error === true) {
            console.log(res.data.errorMessage);
          } else {
            if (res.data) {
              if (res.data?.d?.results.length > 0) {
                let resultsRawSortedFiltered = [];
                if (isAdminFilter) {
                  resultsRawSortedFiltered = res.data.d.results.filter(
                    (item) =>
                      item.OData__ModerationStatus == 2 ||
                      item.OData__ModerationStatus == 3,
                  );
                } else {
                  resultsRawSortedFiltered = res.data.d.results.filter(
                    (item) =>
                      item.OData__ModerationStatus == 3 &&
                      item.EditorId == IsShareByEmailGuestUserObj.data?.Id,
                  );
                }

                // if(resultsRawSortedFiltered.length === 0 && res.data?.d?.__next)
                //   getPendingDraftVersions(res.data?.d?.__next)

                if (resultsRawSortedFiltered.length > 0) {
                  setMinorVersions([
                    ...minorVersions,
                    ...resultsRawSortedFiltered,
                  ]);
                  setMinorVersionsRaw([
                    ...minorVersionsRaw,
                    ...resultsRawSortedFiltered,
                  ]);
                }

                if (res.data?.d?.__next) {
                  setMinorVersionsNextUrl(res.data?.d?.__next);
                } else {
                  setMinorVersionsNextUrl(null);
                }
              } else {
                setMinorVersionsNextUrl(null);
              }
            } else {
              console.log('Config error - unable fetch minor versions.');
            }
          }
        })
        .catch((e) => {
          console.log(e);
        });
    } catch (e) {
      setMinorVersionsNextUrl(null);
    }
  };

  const getPendingDraftVersions = async () => {
    // get versions
    setIsErrorMinorVersions('');
    setIsInProgressMinorVersionList(true);
    setIsMinorVersionUpdated(false);
    setMinorVersionIframeProp(null);
    setMinorVersionIframePropRaw(null);
    setMinorVersionIframeSrc(null);
    setMinorVersionIframeSrcTitle(null);
    setIsMinorVersionCommentsOpen(false);
    setSearchMinorVersion('');
    setMinorVersionComments('');

    cancelAllPendingDraftVersionLongPullingRequests();

    if (draftCommentTextInput.current) draftCommentTextInput.current.value = '';

    if (searchMinorVersionTextInput.current)
      searchMinorVersionTextInput.current.value = '';

    let siteUrl;
    let siteName;
    if (minorVersionsResortTarget) {
      siteUrl = siteNameToSiteUrlMapping(minorVersionsResortTarget);
      siteName = minorVersionsResortTarget;
    } else {
      if (accessibleResorts.length > 0) {
        // default to first accesible resort
        siteUrl = accessibleResorts[0]?.SiteURL;
        siteName = accessibleResorts[0]?.Sitename;

        const defaultResort = setDefaultResortSelection();
        if (minorVersionsResortTarget === null) {
          setMinorVersionsResortTarget(defaultResort);
        }
      }
    }

    try {
      const isSiteAdmin = await axios.get(
        `${siteUrl}/_api/web/currentuser?$select=*,IsShareByEmailGuestUser`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: 'application/json;',
          },
        },
      );
      setIsShareByEmailGuestUserObj(isSiteAdmin);

      const isSiteOwnerRes = await axios.get(
        `${siteUrl}/_api/web/currentuser/groups`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
          },
          maxBodyLength: Infinity,
        },
      );

      let isSiteOwner = false;
      if (isSiteOwnerRes) {
        if (
          isSiteOwnerRes.data?.value &&
          isSiteOwnerRes.data?.value.length > 0
        ) {
          for (let i = 0; i < isSiteOwnerRes.data?.value.length; i++) {
            const groupName = isSiteOwnerRes.data?.value[i]?.Title;
            if (
              groupName.toLowerCase() === `${siteName.toLowerCase()} owners`
            ) {
              isSiteOwner = true;
            }
          }
        }
      }

      const now = new Date();
      const lastHours = new Date('2025-03-24T00:00:00.000Z'); //new Date(now.getTime() - process.env.REACT_APP_APPROVAL_PULL_DATA_LAST_HOUR * 60 * 60 * 1000);

      let isAdminFilterLocal = false;
      let filter = `OData__ModerationStatus eq 3 and EditorId eq ${isSiteAdmin.data?.Id}`;
      if (isSiteAdmin.data?.IsSiteAdmin === true || isSiteOwner === true) {
        filter = 'OData__ModerationStatus eq 2 or OData__ModerationStatus eq 3'; //and TaxCatchAll/Term eq '1-Site plan'
        isAdminFilterLocal = true;
      }

      // `${siteUrl}/_api/web/lists/getbytitle('Documents')/items?$filter=(${filter})&$select=*,Author/Title,Editor/Title,FileDirRef,UniqueId,FileRef,OData__ModerationStatus,Editor/EMail%20&$expand=Author,Editor&$top=100`,
      let Url = `${siteUrl}/_api/web/lists/getbytitle('Documents')/items?$filter=(Modified ge datetime'${lastHours.toISOString()}')&$select=*,Author/Title,Editor/Title,FileDirRef,UniqueId,FileRef,OData__ModerationStatus,Editor/EMail%20&$expand=Author,Editor&$orderby=Modified desc&$top=100`;

      const accessToken = await getAccessToken();

      // axios
      //   .get(Url, {
      //     headers: {
      //       Accept: 'application/json;odata=verbose',
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //     maxBodyLength: Infinity,
      //   })
      //   .then((res) => {
      //     if (res.data.error === true) {
      //       setIsErrorMinorVersions(res.data.errorMessage);
      //     } else {
      //       if (res.data) {
      //         let resultsRaw = res.data?.d?.results;
      //         if (res.data?.d?.results.length > 0) {
      //           let resultsRawSorted = resultsRaw.sort(
      //             (a, b) =>
      //               a.OData__ModerationStatus - b.OData__ModerationStatus,
      //           );

      //           let resultsRawSortedFiltered = [];
      //           if (isAdminFilterLocal) {
      //             resultsRawSortedFiltered = res.data.d.results.filter(
      //               (item) =>
      //                 item.OData__ModerationStatus == 2 ||
      //                 item.OData__ModerationStatus == 3,
      //             );
      //             setIsAdminFilter(true);
      //           } else {
      //             resultsRawSortedFiltered = res.data.d.results.filter(
      //               (item) =>
      //                 item.OData__ModerationStatus == 3 &&
      //                 item.EditorId == isSiteAdmin.data?.Id,
      //             );
      //           }

      //           // if(resultsRawSortedFiltered.length === 0 && res.data?.d?.__next)
      //           //   getPendingDraftVersions(res.data?.d?.__next)

      //           setMinorVersions(resultsRawSortedFiltered);
      //           setMinorVersionsRaw(resultsRawSortedFiltered);

      //           if (res.data?.d?.__next)
      //             setMinorVersionsNextUrl(res.data?.d?.__next);
      //         } else {
      //           setMinorVersions([]);
      //           setMinorVersionsRaw([]);
      //           setMinorVersionsNextUrl(null);
      //         }
      //       } else {
      //         setIsErrorMinorVersions(
      //           'Config error - unable fetch minor versions.',
      //         );
      //       }
      //     }
      //     setIsInProgressMinorVersionList(false);
      //   })
      //   .catch((e) => {
      //     setMinorVersions([]);
      //     setMinorVersionsRaw([]);
      //     setMinorVersionsNextUrl(null);
      //     if (e.status === 401) {
      //       setTimeout(function () {
      //         localStorage.clear();
      //         window.location.href = '/';
      //       }, 1000);
      //     }
      //     setIsInProgressMinorVersionList(false);
      //   });
    } catch (e) {
      if (e.status === 401) {
        setTimeout(function () {
          localStorage.clear();
          window.location.href = '/';
        }, 1000);
      }
      setIsInProgressMinorVersionList(false);
    }
  };

  useEffect(() => {
    if (
      isMinorVersionListOpen &&
      Object.keys(termsDataLocal?.Resort).length > 0 &&
      isInProgressMinorVersionList === false
    ) {
      getPendingDraftVersions(); // send kill to long pull
    }

    if (isMinorVersionListOpen === false) {
      setIsInProgressMinorVersionList(false);
      setMinorVersions([]);
      setMinorVersionsRaw([]);
      setMinorVersionsNextUrl(null);
      // setMinorVersionsResortTarget(null);
      setIsErrorMinorVersions('');
      setIsMinorVersionUpdated(false);
      setMinorVersionIframeProp(null);
      setMinorVersionIframePropRaw(null);
      setMinorVersionIframeSrc(null);
      setMinorVersionIframeSrcTitle(null);
      setIsMinorVersionCommentsOpen(false);
      setSearchMinorVersion('');
      setMinorVersionComments('');

      if (draftCommentTextInput.current)
        draftCommentTextInput.current.value = '';

      if (searchMinorVersionTextInput.current)
        searchMinorVersionTextInput.current.value = '';
    }
  }, [isMinorVersionListOpen, minorVersionsResortTarget]);

  const parseAccessibleSites = (Rows) => {
    var parsedSites = [];
    for (let i = 0; i < Rows.length; i++) {
      const element = Rows[i];
      // ignore hub
      if (element?.Cells[0]?.Value.toUpperCase().includes('HUB')) continue;

      parsedSites.push({
        Sitename: element?.Cells[0]?.Value,
        SiteURL: element?.Cells[1]?.Value,
      });
    }
    return parsedSites;
  };

  const parseFilter = (filterParam = null) => {
    let filter_ = filterParam || filter;
    let filterStringParam = '';
    for (let key in filter_) {
      if (key === 'prevFilter') continue;

      let tempArr = [];
      let isCurrLastArr = false;
      for (let i = 0; i < filter_[key].length; i++) {
        const filterValueString = `${filter_[key][i].split('|')[0].includes(' ') ? `"${filter_[key][i].split('|')[0]}"` : filter_[key][i].split('|')[0]}`;
        tempArr.push(filterValueString);
        if (i === filter_[key].length - 1) {
          isCurrLastArr = true;
        }
      }

      const isNullOverideSearch = Object.entries(filter_[key]).filter(
        ([key, valueArray]) =>
          valueArray.toLowerCase().includes('to be tagged'),
      );

      if (isNullOverideSearch.length > 0) {
        filterStringParam = `${filterStringParam} -${termsMapData[key]}:*`;
      } else {
        filterStringParam = `${filterStringParam} ${tempArr.length > 0 ? `${termsMapData[key]}:` : ''}${isCurrLastArr ? `(${tempArr.join(' OR ')})` : tempArr.join(' OR ')}`;
      }
    }

    return filterStringParam.replace(/\s+/g, ' ');
  };

  const renameKey = (obj, oldKey, newKey) => {
    try {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) =>
          key === oldKey ? [newKey, value] : [key, value],
        ),
      );
    } catch (error) {
      return obj;
    }
  };

  const groupResponse = (RawRows, groupBy) => {
    var groupedReferences = [];
    for (let i = 0; i < RawRows.length; i++) {
      const perItemFile = RawRows[i]['Cells'];
      const parsedGroupValue = perItemFile.find(
        (perItemFile) => perItemFile.Key === groupBy,
      );
      if (!groupedReferences[parsedGroupValue?.Value]) {
        groupedReferences[parsedGroupValue?.Value] = [];
      }
      groupedReferences[parsedGroupValue?.Value].push(i);
    }
    return renameKey(groupedReferences, 'null', 'znull');
  };

  useEffect(() => {
    if (
      response.length &&
      params?.docId &&
      window.location.pathname.includes('/view')
    ) {
      openModalById(params?.docId, response);
    }
  }, [params?.docId]);

  useEffect(() => {
    if (params?.docId && window.location.pathname.includes('/view')) {
      setTimeout(() => {
        handleSearchFilesByDocId();
      }, 1000);
    } else if (
      params?.docId &&
      window.location.pathname.includes('/download')
    ) {
      setTimeout(() => {
        handleDownloadFileByDocId();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const slug = window.location.pathname;
    if (
      prevSlug.current &&
      prevSlug.current.includes('view') &&
      !slug.includes('view') &&
      response.length <= 1 &&
      searchConfigs.length > 0
    ) {
      authCheck();
      handleSearchFiles();
    }
    prevSlug.current = window.location.pathname;
  }, [window.location.pathname]);

  const { setDocName, handleOpenSplit } = useSplitDrawing();
  const setFormValues = useBulkUploadStore((state) => state.setFormValues);
  const setOpen = useBulkUploadStore((state) => state.setOpen);

  useEffect(() => {
    if (
      response.length &&
      params?.docName &&
      window.location.pathname.includes('/split-drawing')
    ) {
      setDocName(params?.docName);
      setFormValues({
        Title: params?.docName,
        [TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE]: 'Drawing',
      });
      setOpen(true);
      handleOpenSplit();
    }
  }, [params?.docName]);

  const handleSearchFilesByDocId = async () => {
    if (!isInprogress && params?.docId) {
      setIsError('');
      setInprogress(true);
      authCheck();
      const documentFound = await findDocumentById(params?.docId);
      onOpenModal(documentFound);
      setInprogress(false);
    }
  };

  const handleDownloadFileByDocId = async () => {
    if (!isInprogress && params?.docId) {
      setIsError('');
      setInprogress(true);
      authCheck();
      const documentFound = await findDocumentById(params?.docId);
      const downloadUrl = getKeyValue(documentFound.Cells, 'Path');
      window.open(downloadUrl, '_blank');
      setInprogress(false);
    }
  };

  const openModalById = (docId, data) => {
    const filteredData = data.filter((item) => {
      const uniqueId = item.Cells.find(
        (cell) => cell.Key === 'UniqueId',
      )?.Value;
      return formatUniqueId(uniqueId) === docId;
    });

    onOpenModal(filteredData[0]);
  };

  const findDocumentById = async (docId) => {
    const data = JSON.stringify({
      request: {
        Querytext: `UniqueId:${docId} ContentType:'Document' ContentType:'${process.env.REACT_APP_CT_NAME}'  contentclass:STS_ListItem_DocumentLibrary (RelatedHubSites:${process.env.REACT_APP_RELATEDHUBSITE}) (-SiteId:${process.env.REACT_APP_RELATEDHUBSITE})`,
        SelectProperties: {
          results: process.env.REACT_APP_SELECTPROP.split(','),
        },
        StartRow: 0,
        RowLimit: process.env.REACT_APP_MAXRESULTS,
        TrimDuplicates: false,
        ClientType: 'PnPModernSearch',
        __metadata: {
          type: 'Microsoft.Office.Server.Search.REST.SearchRequest',
        },
      },
    });

    try {
      const response = await axios.post(
        `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com/sites/${process.env.REACT_APP_HUB_NAME}/_api/search/postquery`,
        data,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          maxBodyLength: Infinity,
        },
      );

      if (response.data.error) {
        setIsError(response.data.errorMessage);
      } else if (response.data) {
        const data =
          response.data.PrimaryQueryResult.RelevantResults.Table.Rows;

        setIsError('');
        setResponse(data);

        const filteredData = data.filter((item) => {
          const uniqueId = item.Cells.find(
            (cell) => cell.Key === 'UniqueId',
          )?.Value;
          return formatUniqueId(uniqueId) === docId;
        });

        return filteredData[0];
      } else {
        setIsError('Search error - unable to fetch files.');
      }
    } catch (error) {
      setIsError(error.message);
      if (error.response?.status === 401) {
        // Uncomment if needed:
        // setTimeout(() => {
        //   localStorage.clear();
        //   window.location.href = '/';
        // }, 1000);
      }
    }
  };

  const handleSearchFiles = async (overideFilter = null) => {
    if (!isInprogress) {
      setIsError('');
      if (
        Object.keys(filter).length === 0 &&
        (searchFileName === null || searchFileName === '') &&
        overideFilter === null
      ) {
        setIsError(
          'Please select the metadata filter to search for documents.',
        );
        return;
      }

      const filterParam = parseFilter(overideFilter);

      let FilterPayload = `${filterParam} ContentType:'Document' ContentType:'${process.env.REACT_APP_CT_NAME}'  contentclass:STS_ListItem_DocumentLibrary (RelatedHubSites:${process.env.REACT_APP_RELATEDHUBSITE}) (-SiteId:${process.env.REACT_APP_RELATEDHUBSITE})`;

      if (searchFileName !== null) {
        FilterPayload = `Title:(${searchFileName}*) ContentType:'Document' ContentType:'${process.env.REACT_APP_CT_NAME}'  contentclass:STS_ListItem_DocumentLibrary (RelatedHubSites:${process.env.REACT_APP_RELATEDHUBSITE}) (-SiteId:${process.env.REACT_APP_RELATEDHUBSITE})`;
      }

      if (overideFilter !== null) {
        FilterPayload = `${filterParam} ContentType:'Document' ContentType:'${process.env.REACT_APP_CT_NAME}'  contentclass:STS_ListItem_DocumentLibrary (RelatedHubSites:${process.env.REACT_APP_RELATEDHUBSITE}) (-SiteId:${process.env.REACT_APP_RELATEDHUBSITE})`;
      }

      setInprogress(true);

      const data = JSON.stringify({
        request: {
          Querytext: FilterPayload,
          SelectProperties: {
            results: process.env.REACT_APP_SELECTPROP.split(','),
          },
          StartRow: 0,
          RowLimit: process.env.REACT_APP_MAXRESULTS,
          TrimDuplicates: false,
          ClientType: 'PnPModernSearch',
          __metadata: {
            type: 'Microsoft.Office.Server.Search.REST.SearchRequest',
          },
        },
      });

      try {
        const response = await axios.post(
          `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com/sites/${process.env.REACT_APP_HUB_NAME}/_api/search/postquery`,
          data,
          {
            headers: {
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/json;odata=verbose;charset=utf-8',
              Authorization: `Bearer ${await getAccessToken()}`,
            },
            maxBodyLength: Infinity,
          },
        );

        if (response.data.error) {
          setIsError(response.data.errorMessage);
        } else if (response.data) {
          setIsError('');
          setResponse(
            response.data.PrimaryQueryResult.RelevantResults.Table.Rows,
          );
          setResponseTmp(
            response.data.PrimaryQueryResult.RelevantResults.Table.Rows,
          );

          if (
            response.data.PrimaryQueryResult.RelevantResults.Table.Rows
              .length >= process.env.REACT_APP_MAXRESULTS
          ) {
            setIsError('Please add more filters to refine your search.');
          }

          return response.data.PrimaryQueryResult.RelevantResults.Table.Rows;
        } else {
          setIsError('Search error - unable to fetch files.');
        }
      } catch (error) {
        console.error('Error:', error);
        setIsError(error.message);
        if (error.response?.status === 401) {
          // Uncomment if needed:
          // setTimeout(() => {
          //   localStorage.clear();
          //   window.location.href = '/';
          // }, 1000);
        }
      } finally {
        setInprogress(false);
      }
    }
  };

  const shallowCompare = (obj1, obj2) => {
    // Check if both are objects
    if (
      typeof obj1 !== 'object' ||
      typeof obj2 !== 'object' ||
      obj1 === null ||
      obj2 === null
    ) {
      return false;
    }

    // Compare number of keys
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
      return false;
    }

    // Compare values of each key
    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  };

  const checkIfSavedFilterOverwrite = () => {
    // Early return if no saved config exists
    if (!selectedSavedConfig?.Config) return;

    // Check if the current filter matches the saved config
    const isFilterUnchanged = shallowCompare(
      filter,
      selectedSavedConfig?.Config,
    );

    if (isFilterUnchanged) {
      // Reset the modification flag if filters match
      setIsSavedFilterModified(false);
      return;
    }

    // At this point, we know the filter has been modified
    setIsSavedFilterModified(true);

    // Create updated config with new filter values

    const updatedConfig = {
      ...selectedSavedConfig,
      Config: JSON.stringify(filter),
      // set to null to prevent save config view from auto-filling the configType radio group
      ConfigType: null,
    };

    // Check if we already have a modified version of this config
    const isAlreadyModified = searchConfigs.some(
      (config) => config.ID === selectedSavedConfig.ID && config.modified,
    );

    // If not already modified, create a modified version
    if (!isAlreadyModified) {
      // Add modified markers to the config
      updatedConfig.Id = `${selectedSavedConfig.Id}#modified`;
      updatedConfig.modified = true;
      updatedConfig.Title = `${selectedSavedConfig.Title} [Modified] (Unsaved Search)`;

      // Add the modified config to the list
      // prevent react from rerendering by directly mutating it.
      setSearchConfigs((prev) => {
        prev.push(updatedConfig);
        return prev;
      });
    } else {
      setSearchConfigs((prev) => {
        const configIndex = prev.findIndex(
          (config) => config.Id === selectedSavedConfig.Id,
        );

        if (configIndex >= 0) {
          prev[configIndex] = updatedConfig;
        }

        return prev;
      });
    }

    // Update the selected config to the modified version
    setSelectedSavedConfig(updatedConfig);
    setIsNewConfigType(true);
  };

  const setDefaultResortSelection = () => {
    const supportedResorts = Object.keys(termsData['DMS Terms']['Resort']);
    const accessibleResorts_ = accessibleResorts.filter((accessibleResort) =>
      supportedResorts.includes(accessibleResort.Sitename),
    );
    return accessibleResorts_[0]?.Sitename;
  };

  useEffect(() => {
    if (filter?.Resort) {
      const sortedResort = filter?.Resort.sort((a, b) => (a > b ? 1 : -1));
      setMinorVersionsResortTarget(sortedResort[0]?.split('|')[0]);
    } else {
      const defaultResort = setDefaultResortSelection();
      setMinorVersionsResortTarget(defaultResort);
    }
  }, [filter, accessibleResorts]);

  useEffect(() => {
    if (minorFilter.length > 0) {
      setMinorVersionsResortTarget(minorFilter[minorFilter.length - 1] || null);
    }
  }, [minorFilter]);

  const handleSelectFilterChange = (event, key, value) => {
    if (key === 'Resort') {
      const simpleResort = value.split('|')[0];
      if (event.target.checked) {
        setMinorFilter((prev) => [...prev, simpleResort]);
      } else {
        setMinorFilter((prev) => prev.filter((item) => item !== simpleResort));
      }
    }
    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation(); // Prevent the parent or TreeView event
    }

    let prevFilter = filter;
    if (event.target.checked) {
      if (value.toLowerCase().includes('to be tagged')) {
        // check if has resort selected
        if ('Resort' in prevFilter) {
          // uncheck other field check under the same key
          prevFilter[key] = [];
          prevFilter[key].push(value);

          setFilterNullOveride((prev) => [...prev, key]);
        } else {
          setNoticeSnackIsOpen(true);
          setNoticeSnackMsg(
            'Please select a resort to search for "to be tagged".',
          );
          return;
        }
      } else {
        if (key in prevFilter) {
          prevFilter[key].push(value);
        } else {
          prevFilter[key] = [];
          prevFilter[key].push(value);
        }
      }

      setFilter({ ...filter, ...prevFilter });
    } else {
      if (value.toLowerCase().includes('to be tagged')) {
        setFilterNullOveride((prevItems) =>
          prevItems.filter((item) => item.toLowerCase() !== key.toLowerCase()),
        );
      }

      if (key in prevFilter) {
        const newArr = prevFilter[key].filter(
          (item) => !item.toLowerCase().includes(value.toLowerCase()),
        );
        prevFilter[key] = newArr;
        if (newArr.length <= 0) delete prevFilter[key];

        setFilter({ ...filter, ...prevFilter });
      }
    }

    // Check if saved filter was overwritten
    checkIfSavedFilterOverwrite();
  };

  const handleSelectFilterChangeParent = (event, key) => {
    let prevFilter = filter;
    if (event.target.checked) {
      prevFilter[key] = [];
      prevFilter[key] = Object.values(termsDataLocal[key]).filter(
        (item) => !item.toLowerCase().includes('to be tagged'),
      );

      // dont select to be tagged from parent trigger
      setFilter({ ...filter, ...prevFilter });
    } else {
      setFilterNullOveride([]);
      delete prevFilter[key];
      setFilter({ ...filter, ...prevFilter });
    }
    // setExpandedFilter([]);

    // check if has selected filter and was changed
    checkIfSavedFilterOverwrite();
  };

  const handleGroupingChange = (event) => {
    setGrouping(event.target.value);
  };

  const handleSaveClick = () => {
    if (Object.keys(filter).length <= 0) {
      setIsError('No filter is selected');
      return;
    }
    setIsError('');
    setIsSavedSearchConfigOpen(true);
  };

  const handleSaveSearchConfigActionBtnClick = async (itemId, Mode) => {
    const accessToken = await getAccessToken();
    setIsInProgressSavingConfig(true);
    if (itemId && Mode === 'default') {
      const now = new Date();
      let data = JSON.stringify({
        __metadata: {
          type: `SP.Data.${process.env.REACT_APP_REFDATA_LISTNAME}ListItem`,
        },
        default: now.toISOString(),
      });
      axios
        .post(
          `${process.env.REACT_APP_REFDATA_URL}/web/lists/getbytitle('${process.env.REACT_APP_REFDATA_LISTNAME}')/items(${itemId})`,
          data,
          {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose;charset=utf-8',
              Authorization: `Bearer ${accessToken}`,
              'IF-MATCH': '*',
              'X-HTTP-Method': 'MERGE',
            },
            maxBodyLength: Infinity,
          },
        )
        .then((res) => {
          if (res.data.error === true) {
            setIsError(res.data.errorMessage);
          } // no capture of content returns 204 Empty Response as success.
          setIsInProgressSavingConfig(false);
          // getByTitleItems();
          // setSavedFilterConfigCurDefault(itemId);
        })
        .catch((e) => {
          if (e.status === 401) {
            setTimeout(function () {
              localStorage.clear();
              window.location.href = '/';
            }, 1000);
          } else if (e.status === 403) {
            setIsError(
              'You do not have access rights to any resort, please contact appsupport@gemlife.com.au and copy your resort representative in the email.',
            );
          }
          setIsInProgressSavingConfig(false);
        });
    }

    if (itemId && Mode === 'delete') {
      axios
        .delete(
          `${process.env.REACT_APP_REFDATA_URL}/web/lists/getbytitle('${process.env.REACT_APP_REFDATA_LISTNAME}')/items(${itemId})/recycle`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json;odata=verbose',
              'IF-MATCH': '*', // Prevents conflict if the item has been updated in the meantime
            },
          },
        )
        .then((res) => {
          if (res.data.error === true) {
            setIsError(res.data.errorMessage);
          } // no capture of content returns 204 Empty Response as success.
          // getByTitleItems();
          setIsInProgressSavingConfig(false);
        })
        .catch((e) => {
          if (e.status === 401) {
            setTimeout(function () {
              localStorage.clear();
              window.location.href = '/';
            }, 1000);
          }
          setIsInProgressSavingConfig(false);
        });
    }
  };

  const handleSavedSearchConfigNameTextChange = () => {
    if (
      savedSearchConfigNameTextInput?.current?.value !== null &&
      savedSearchConfigNameTextInput?.current?.value !== ''
    ) {
      setSavedSearchConfigNameText(
        savedSearchConfigNameTextInput.current.value,
      );
    } else {
      setSavedSearchConfigNameText(null);
    }
  };

  const handleSaveSearchConfigClick = async () => {
    const accessToken = await getAccessToken();
    if (
      Object.keys(filter).length &&
      savedSearchConfigNameTextInput.current.value !== null &&
      savedSearchConfigNameTextInput.current.value !== '' &&
      (isSavedSearchConfigType !== '' || selectedSavedConfig?.ConfigType)
    ) {
      setIsInProgressSavingConfig(true);
      const isEditable =
        isNewConfigType || selectedSavedConfig?.Id === 'globalfilesearch';

      if (isEditable) {
        if (isSavedSearchConfigType !== '') {
          let data = JSON.stringify({
            __metadata: {
              type: `SP.Data.${process.env.REACT_APP_REFDATA_LISTNAME}ListItem`,
            },
            Title: savedSearchConfigNameTextInput.current.value,
            Config: JSON.stringify(filter),
            ConfigType: isSavedSearchConfigType,
            Groupby: grouping,
          });
          axios
            .post(
              `${process.env.REACT_APP_REFDATA_URL}/web/lists/getbytitle('${process.env.REACT_APP_REFDATA_LISTNAME}')/items`,
              data,
              {
                headers: {
                  Accept: 'application/json;odata=verbose',
                  'Content-Type':
                    'application/json;odata=verbose;charset=utf-8',
                  Authorization: `Bearer ${accessToken}`,
                },
                maxBodyLength: Infinity,
              },
            )
            .then((res) => {
              if (res.data.error === true) {
                setIsError(res.data.errorMessage);
              } else {
                if (res.data) {
                  console.log(res.data);
                } else {
                  setIsError('Config error - unable to fetch saved configs.');
                }
              }
              setIsInProgressSavingConfig(false);
              // getByTitleItems();
              // setIsSavedSearchConfigOpen(false);
            })
            .catch((e) => {
              if (e.status === 401) {
                setTimeout(function () {
                  localStorage.clear();
                  window.location.href = '/';
                }, 1000);
              }
              setIsInProgressSavingConfig(false);
            });
        }
      } else {
        if (selectedSavedConfig?.ConfigType) {
          let data = JSON.stringify({
            __metadata: {
              type: `SP.Data.${process.env.REACT_APP_REFDATA_LISTNAME}ListItem`,
            },
            Title: savedSearchConfigNameTextInput.current.value,
            Config: JSON.stringify(filter),
            ConfigType: selectedSavedConfig?.ConfigType,
            Groupby: grouping,
          });
          axios
            .post(
              `${process.env.REACT_APP_REFDATA_URL}/web/lists/getbytitle('${process.env.REACT_APP_REFDATA_LISTNAME}')/items(${selectedSavedConfig?.Id})`,
              data,
              {
                headers: {
                  Accept: 'application/json;odata=verbose',
                  'Content-Type':
                    'application/json;odata=verbose;charset=utf-8',
                  Authorization: `Bearer ${accessToken}`,
                  'IF-MATCH': '*',
                  'X-HTTP-Method': 'MERGE',
                },
                maxBodyLength: Infinity,
              },
            )
            .then((res) => {
              if (res.data.error === true) {
                setIsError(res.data.errorMessage);
              } // no capture of content returns 204 Empty Response as success.
              setIsInProgressSavingConfig(false);
              // getByTitleItems();
              // setIsSavedSearchConfigOpen(false);
            })
            .catch((e) => {
              if (e.status === 401) {
                setTimeout(function () {
                  localStorage.clear();
                  window.location.href = '/';
                }, 1000);
              }
              setIsInProgressSavingConfig(false);
              // setIsSavedSearchConfigOpen(false);
            });
        }
      }
    }
  };

  const handleSaveFilterSelectChange = async (event) => {
    switch (event.target.value) {
      case 'globalfilesearch':
        setSelectedSavedConfig({
          Id: 'globalfilesearch',
          Title: 'globalfilesearch',
        });
        setResponse([]);
        setResponseTmp([]);
        setFilter({});
        setIsSearchCriteriaVisible(false);

        setSearchFileNameTextInputFocused(true);
        break;
      case 'searchConfigs':
        setIsSavedSearchConfigOpen(true);
        break;
      default:
        const SelectedSavedFilter = searchConfigs.find(
          (searchConfig) => searchConfig.Id === event.target.value,
        );
        const parsedFilter = SelectedSavedFilter?.Config
          ? JSON.parse(SelectedSavedFilter?.Config)
          : {};

        const filteredAccessibleResorts = parsedFilter?.Resort?.filter(
          (item) => {
            const resort = item?.split('|')[0];
            return accessibleResorts
              .map((res) => res?.Sitename)
              .includes(resort);
          },
        );

        const mappedFilter = {
          ...parsedFilter,
          ...(parsedFilter?.Resort
            ? {
                Resort: filteredAccessibleResorts,
              }
            : {}),
        };

        if (SelectedSavedFilter?.Config) {
          if (SelectedSavedFilter?.Groupby)
            setGrouping(SelectedSavedFilter?.Groupby);

          setIsSavedFilterModified(false);
          setFilter(mappedFilter);
          setSelectedSavedConfig(SelectedSavedFilter);
          setExpandedFilter([]);
          setResponse([]);
          setResponseTmp([]);
          setSearchFileName(null);
          const data = await handleSearchFiles(mappedFilter);

          // Auto Open Modal
          if (
            data &&
            params?.docId &&
            window.location.pathname.includes('/view')
          ) {
            openModalById(params?.docId, data);
          }

          if (
            data &&
            params?.docName &&
            window.location.pathname.includes('/split-drawing')
          ) {
            setDocName(params?.docName);
            setFormValues({
              Title: params?.docName,
              [TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE]: 'Drawing',
            });
            setOpen(true);
            handleOpenSplit();
          }
        }
        setSearchFileNameTextInputFocused(false);

        setIsNewConfigType(!!SelectedSavedFilter.modified);
    }

    // prevent re-render by using direct mutation, this is a very bad practice tho. but it's needed to keep my sanity :).
    searchConfigs.splice(
      0,
      searchConfigs.length,
      ...searchConfigs.filter((config) => !config.modified),
    );
  };

  const handleSavedSearchConfigTypeChange = (event) => {
    setIsSavedSearchConfigType(event.target.value);
  };

  const checkIfChecked = (key, keyj) => {
    if (Object.keys(filter).length > 0) {
      if (filter?.[key]) {
        return filter?.[key].some((item) =>
          item.toLowerCase().includes(`${keyj}|`.toLowerCase()),
        );
      }
    }

    return false;
  };

  const filenameSearchEnterKey = (event) => {
    if (event.key === 'Enter') {
      handleSearchFiles();
    }
  };

  const { showModal, onOpenModal, onCloseModal } = useShowModal();

  useEffect(() => {
    if (response) {
      setCaptureResponse(response);
    }
  }, [response]);

  const handleMinorVersionResortSelectChange = (event) => {
    if (event?.target?.value) {
      setMinorVersionsResortTarget(event.target.value);
      setMinorVersionIframeSrc(null);
      setMinorVersionIframeSrcTitle(null);
      setMinorVersionComments('');
    }
  };

  const termsGuidToLabel = (termKey, termGuid) => {
    if (
      Object.keys(termsDataLocal).length > 0 &&
      Object.keys(termsDataLocal[termKey]).length > 0
    ) {
      const mappedLabel = Object.fromEntries(
        Object.entries(termsDataLocal[termKey]).filter(([key, value]) =>
          value.includes(`|${termGuid}`),
        ),
      );
      if (Object.keys(mappedLabel).length > 0) {
        let mappedLabelParsed = Object.values(mappedLabel)[0].split('|')[0];
        return mappedLabelParsed;
      }
    }
    return '';
  };

  const handleMinorVersionResortActionClick = async (
    event,
    mode,
    docId,
    FileDirRef,
    Title,
    Version,
    FileRef,
  ) => {
    const siteUrl = siteNameToSiteUrlMapping(minorVersionsResortTarget);
    const accessToken = await getAccessToken();
    setIsInProgressMinorVersionList(true);
    if (mode == 2) {
      axios
        .post(
          `${siteUrl}/_api/web/GetFileByServerRelativePath(DecodedUrl=@a1)/Publish(@a2)?@a1='${FileRef}'&@a2='${draftCommentTextInput.current.value !== null && draftCommentTextInput.current.value !== '' ? draftCommentTextInput.current.value : '<no comment>'}'`,
          {},
          {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose;charset=utf-8',
              Authorization: `Bearer ${accessToken}`,
            },
            maxBodyLength: Infinity,
          },
        )
        .then((res) => {
          if (res.data.error === true) {
            setIsErrorMinorVersions(res.data.errorMessage);
          } else {
            if (res.data) {
              setIsMinorVersionUpdated(
                `Request Approval Sent for File ${Title === null ? '<not specified>' : Title} with version v${Version}.`,
              );
              setIsMinorVersionCommentsOpen(false);
              draftCommentTextInput.current.value = '';
              getPendingDraftVersions();
            } else {
              setIsErrorMinorVersions(
                'Update error - unable to update file status.',
              );
            }
          }
          setIsInProgressMinorVersionList(false);
        })
        .catch((e) => {
          setIsInProgressMinorVersionList(false);
          setIsError(e.message);
          if (e.status === 401) {
            setTimeout(function () {
              localStorage.clear();
              window.location.href = '/';
            }, 1000);
          }
        });
    } else {
      let data = JSON.stringify({
        itemIds: [docId],
        formValues: [
          {
            FieldName: '_ModerationStatus',
            FieldValue: `${mode}`,
          },
          {
            FieldName: '_ModerationComments',
            FieldValue: mode === 0 ? 'Approved' : (rejectReason ?? 'Denied'),
          },
        ],
        folderPath: '',
      });
      axios
        .post(
          `${siteUrl}/_api/web/GetListUsingPath(DecodedUrl=@a1)/BulkValidateUpdateListItems()?@a1='${FileDirRef}'`,
          data,
          {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose;charset=utf-8',
              Authorization: `Bearer ${accessToken}`,
            },
            maxBodyLength: Infinity,
          },
        )
        .then((res) => {
          if (res.data.error === true) {
            setIsErrorMinorVersions(res.data.errorMessage);
          } else {
            if (res.data) {
              if (res.data?.d?.BulkValidateUpdateListItems?.results) {
                let isMinorVersionActionSuccess = true;
                for (
                  let i = 0;
                  i < res.data?.d?.BulkValidateUpdateListItems?.results.length;
                  i++
                ) {
                  const errorRes =
                    res.data?.d?.BulkValidateUpdateListItems?.results[i];
                  if (errorRes?.ErrorMessage !== null) {
                    isMinorVersionActionSuccess = false;
                    setIsErrorMinorVersions(errorRes?.ErrorMessage);
                    break;
                  }
                }

                if (isMinorVersionActionSuccess) {
                  setIsMinorVersionUpdated(
                    `File ${Title === null ? '<not specified>' : Title} with version v${Version} was ${mode === 0 ? 'approved' : 'declined'}.`,
                  );
                  getPendingDraftVersions();
                }
              }
            } else {
              setIsErrorMinorVersions(
                'Update error - unable to update file status.',
              );
            }
          }
          setIsInProgressMinorVersionList(false);
        })
        .catch((e) => {
          setIsInProgressMinorVersionList(false);
          setIsError(e.message);
          if (e.status === 401) {
            setTimeout(function () {
              localStorage.clear();
              window.location.href = '/';
            }, 1000);
          }
        });
    }

    const resort = minorVersionIframeProp?.['Resort'];

    let isAutoApproved = false;

    const siteUrl_ = accessibleResortsSanitized.filter(
      (accessibleResort) =>
        accessibleResort?.Sitename.toUpperCase() === resort.toUpperCase(),
    );
    const siteName = siteUrl_[0]?.Sitename;

    if (siteUrl && siteName) {
      checkForAutoApproval({
        siteUrl,
        siteName,
        callback: (e) => {
          isAutoApproved = e;
        },
        accessToken,
      });
    }

    const responseListItemAllFields = await getFileID({
      siteNameUrl: siteUrl,
      UniqueId: minorVersionIframePropRaw.UniqueId,
      accessToken,
    });

    const fileDirRef = responseListItemAllFields.data?.d?.FileDirRef;
    const fileRef = responseListItemAllFields.data?.d?.FileRef;

    const fileRefArray = String(fileRef).split('/');
    const fileName = fileRefArray[fileRefArray.length - 1];

    const drawingAreaValue = minorVersionIframeProp?.['Drawing Area'];

    const isDrawingDocType =
      String(minorVersionIframeProp?.['Document Type']).toLowerCase() ===
      'drawing';

    const isExistDrawingFolder = String(fileDirRef).includes(
      `Drawings/${drawingAreaValue}`,
    );

    const baseSite =
      String(siteUrl).split('/')[String(siteUrl).split('/').length - 1];

    const rootFolderURL = `/sites/${baseSite}/Shared Documents/Drawings`;
    const folderURL = `/sites/${baseSite}/Shared Documents/Drawings/${drawingAreaValue}`;

    if (isDrawingDocType) {
      if (!isExistDrawingFolder && drawingAreaValue) {
        await createCheckSharepointFolderIfExist(
          siteUrl,
          baseSite,
          ['Drawings', drawingAreaValue],
          accessToken,
        );
        if (isAutoApproved) {
          await autoApproveFolder(
            siteUrl,
            accessToken,
            rootFolderURL,
            responseListItemAllFields,
          );
          await autoApproveFolder(
            siteUrl,
            accessToken,
            folderURL,
            responseListItemAllFields,
          );
        }
      }

      if (isAutoApproved) {
        const hasWarningOrError = await moveFileToFolder(
          siteUrl,
          accessToken,
          `${fileDirRef}/${fileName}`,
          `${folderURL}/${fileName}`,
        );

        if (hasWarningOrError.length > 0) {
          setIsError(FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE);
        }
      }
    }
  };

  useEffect(() => {
    if (minorVersions.length > 0) {
      const firstRow = minorVersions[0];
      setMinorVersionIframePropRaw(firstRow);
      let siteUrl = siteNameToSiteUrlMapping(minorVersionsResortTarget);
      let iframeSource = `${siteUrl}/_layouts/15/embed.aspx?UniqueId=${firstRow?.UniqueId}&version=${firstRow?.Id}`;
      setMinorVersionIframeSrc(iframeSource);
      setMinorVersionIframeSrcTitle(firstRow?.Title);

      let MinorVersionIframePropTmp = {};
      Object.keys(termsMapCTData).forEach((key) => {
        if (!MinorVersionIframePropTmp[key]) {
          if (firstRow?.[termsMapCTData[key]]?.TermGuid) {
            MinorVersionIframePropTmp[key] = termsGuidToLabel(
              key,
              firstRow?.[termsMapCTData[key]]?.TermGuid,
            );
          } else {
            MinorVersionIframePropTmp[key] = firstRow?.[termsMapCTData[key]];
          }
        }
      });
      setMinorVersionIframeProp(MinorVersionIframePropTmp);
    }
  }, [minorVersions, minorVersionsResortTarget, minorVersionsNextUrl]);

  const handleViewFileContentActionClick = async (
    UniqueId,
    Id,
    Title,
    UIVersionString,
    versionURI,
  ) => {
    if (minorVersionsResortTarget) {
      let siteUrl = siteNameToSiteUrlMapping(minorVersionsResortTarget);
      let iframeSource = `${siteUrl}/_layouts/15/embed.aspx?UniqueId=${UniqueId}&version=${Id}`;
      setMinorVersionIframeSrc(iframeSource);
      setMinorVersionIframeSrcTitle(Title ?? `<Not Specified> - ${Id}`);

      const currRow = minorVersions.filter(
        (item) => (item.Id || `<Not Specified> - ${Id}`) === Id,
      );
      if (currRow.length > 0) {
        setMinorVersionIframePropRaw(currRow[0]);
        let MinorVersionIframePropTmp = {};
        Object.keys(termsMapCTData).forEach((key) => {
          if (!MinorVersionIframePropTmp[key]) {
            if (currRow[0]?.[termsMapCTData[key]]?.TermGuid) {
              MinorVersionIframePropTmp[key] = termsGuidToLabel(
                key,
                currRow[0]?.[termsMapCTData[key]]?.TermGuid,
              );
            } else {
              MinorVersionIframePropTmp[key] =
                currRow[0]?.[termsMapCTData[key]];
            }
          }
        });
        setMinorVersionIframeProp(MinorVersionIframePropTmp);
        setIsMinorVersionCommentsOpen(false);
      }
      if (versionURI) {
        setMinorVersionComments('');
        const accessToken = await getAccessToken();
        const versionDetails = await axios.get(`${versionURI}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
          },
          maxBodyLength: Infinity,
        });
        if (
          versionDetails?.data?.value &&
          versionDetails?.data?.value.length > 0
        ) {
          const filterVersionDetails = versionDetails.data.value.filter(
            (item) => item.VersionLabel == UIVersionString,
          );
          if (filterVersionDetails.length > 0) {
            const CheckinComment =
              filterVersionDetails[0]?.OData__x005f_CheckinComment;
            setMinorVersionComments(CheckinComment);
          }
        }
      }
    }
  };

  const handleSearchCriteriaVisibleClick = () =>
    setIsSearchCriteriaVisible(isSearchCriteriaVisible ? false : true);
  const handleSearchFilesClick = () => handleSearchFiles();
  const handleMinorVersionListOpenClick = () =>
    setIsMinorVersionListOpen(isMinorVersionListOpen ? false : true);
  const handleSearchEnterKeyDown = (e) => filenameSearchEnterKey(e);

  const handleSearchFileNameTextInputChange = (e) => {
    if (searchTextInput.current) {
      if (
        searchFileNameTextInput?.current?.value !== null &&
        searchFileNameTextInput?.current?.value !== ''
      ) {
        setSearchFileName(searchFileNameTextInput.current.value);
      } else {
        setSearchFileName(null);
      }
      setExpandedFilter([]);
    }
  };

  useEffect(() => {
    if (searchFileName !== null || searchFileName !== '') {
      setSelectedSavedConfig({
        Id: 'globalfilesearch',
        Title: 'globalfilesearch',
      });
      setResponse([]);
      setResponseTmp([]);
      setFilter({});
      setIsSearchCriteriaVisible(false);
    }
  }, [searchFileName]);

  const handleFilterChange = debounce((event) => {
    const value = event.target.value;
    handleFilterSearch(value);
  }, 500);

  const handleFilterSearch = (searchText) => {
    const indices = responseTmp
      .map((item, index) => {
        // Check if the item has the key "Title" and the value includes the search term
        const dynamicTitle = formatTitle(item.Cells);
        if (dynamicTitle.toLowerCase().includes(searchText.toLowerCase())) {
          return index; // Return the index of matching items
        }
        return -1; // No match
      })
      .filter((index) => index !== -1); // Remove non-matching indices
    const filteredData = responseTmp.filter((item, index) =>
      indices.includes(index),
    );
    setResponse(filteredData);
  };

  const debouncedMinorVersionSearch = useCallback(
    debounce(() => {
      if (
        searchMinorVersionTextInput?.current?.value !== null &&
        searchMinorVersionTextInput?.current?.value !== ''
      ) {
        setSearchMinorVersion(searchMinorVersionTextInput?.current?.value);
      } else {
        setSearchMinorVersion('');
      }
    }, 500), // Wait for 500ms after the user stops typing
    [],
  );

  const handleSearchMinorVersionTextInputChange = (event) => {
    debouncedMinorVersionSearch();
  };

  useEffect(() => {
    setMinorVersionIframeProp(null);
    setMinorVersionIframePropRaw(null);
    setMinorVersionIframeSrc(null);
    setMinorVersionIframeSrcTitle(null);
    setIsMinorVersionCommentsOpen(false);
    setMinorVersionComments('');

    if (draftCommentTextInput.current) draftCommentTextInput.current.value = '';

    if (searchMinorVersion !== null && searchMinorVersion !== '') {
      const filteredMinorVersions = minorVersionsRaw.filter((item) =>
        (item?.Title || '')
          .toLowerCase()
          .includes(searchMinorVersion.toLowerCase()),
      );
      setMinorVersions(filteredMinorVersions);
    } else {
      setMinorVersions(minorVersionsRaw);
    }
  }, [searchMinorVersion]);

  const formatTitle = (cells, excludeArr = []) => {
    if (!cells) return '';

    const {
      businessMetadata,
      resortMetadata,
      departmentMetadata,
      buildingMetadata,
      documentType,
      drawingNumberMetadata,
      titleMetadata,
      revisionNumber,
    } = normalizeCells(cells);

    const getMetadataText = (key, text) => {
      const shouldRemove =
        (filter?.[key] && Object.keys(filter?.[key]).length === 1) ||
        excludeArr.includes(key);

      if (shouldRemove) return null;

      return text;
    };

    return [
      getMetadataText('Business', businessMetadata),
      getMetadataText('Resort', resortMetadata),
      getMetadataText('Department', departmentMetadata),
      getMetadataText('Building', buildingMetadata),
      getMetadataText('DocumentType', documentType),
      getMetadataText('DrawingNumber', drawingNumberMetadata),
      getMetadataText('Title', titleMetadata),
      getMetadataText('RevNumber', revisionNumber),
    ]
      .filter(Boolean)
      .join(' - ');
  };

  // view page

  const getNextKeySection = (currentKey) => {
    const keys = Object.keys(filterGroup);
    const currentIndex = keys.indexOf(currentKey);
    if (currentIndex === -1 || currentIndex === keys.length - 1) {
      return null;
    }
    return keys[currentIndex + 1];
  };

  const getPreviousKeySection = (currentKey) => {
    const keys = Object.keys(filterGroup);
    const currentIndex = keys.indexOf(currentKey);
    if (currentIndex > 0) {
      return keys[currentIndex - 1];
    }
    return null;
  };

  const findValueLocation = (obj, target) => {
    if (obj) {
      for (const [key, arr] of Object.entries(obj)) {
        const index = arr.indexOf(target);
        if (index !== -1) {
          return { key, index };
        }
      }
    }
    return null;
  };

  const getNextKeyItem = (
    groupingKey,
    resourceIndex,
    titleParentIndex,
    mode,
  ) => {
    const indexLoc = findValueLocation(
      filterGroup?.[groupingKey],
      resourceIndex,
    ); //locate the index by index matrix - {key: 'Of 12 Sewer Works Plan 4 Of 6', index: 2}

    if (mode == 'next') {
      if (filterGroup?.[groupingKey][indexLoc.key][indexLoc.index + 1])
        return filterGroup?.[groupingKey][indexLoc.key][indexLoc.index + 1];

      if (
        filterGroup?.[groupingKey][
          Object.keys(filterGroup?.[groupingKey])[titleParentIndex + 1]
        ]
      )
        return filterGroup?.[groupingKey][
          Object.keys(filterGroup?.[groupingKey])[titleParentIndex + 1]
        ][0]; // always start with the first index in case multi values.
    } else {
      // prev
      if (filterGroup?.[groupingKey][indexLoc.key][indexLoc.index - 1])
        return filterGroup?.[groupingKey][indexLoc.key][indexLoc.index - 1];

      if (
        filterGroup?.[groupingKey][
          Object.keys(filterGroup?.[groupingKey])[titleParentIndex - 1]
        ]
      )
        return filterGroup?.[groupingKey][
          Object.keys(filterGroup?.[groupingKey])[titleParentIndex - 1]
        ][
          filterGroup?.[groupingKey][
            Object.keys(filterGroup?.[groupingKey])[titleParentIndex - 1]
          ].length - 1
        ]; // always start with the end index in case multi values.
    }
  };

  const handleRejectModalOpen = () => setOpenRejectModal(true);
  const handleRejectModalClose = () => setOpenRejectModal(false);

  const handleChangeReason = (e) => {
    e.preventDefault();
    setRejectReason(e.target.value);
  };

  const errMessageStr = useMemo(() => {
    if (isError) {
      if (isError.includes('filter')) {
        return <Alert severity="warning">{isError}</Alert>;
      } else if (isError.includes('popup_window_error')) {
        return (
          <Alert severity="error">
            {`Error opening the popup window. This might occur if you're using Internet Explorer or if popups are blocked in your browser. To quickly fix this, follow the instructions in`}{' '}
            <a
              href="https://gemlife.sharepoint.com/sites/GemDocs-KB/SitePages/Browser-guideline-for-download.aspx"
              target="_blank"
            >
              browser guidelines for download
            </a>
          </Alert>
        );
      } else {
        return (
          <Alert severity="error">
            {isError}
            <a href="/">go back</a>
          </Alert>
        );
      }
    }
    return;
  }, [isError]);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        padding: '0px 0px 10px 0px',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <CustomNavigation
          key={isAuth ? 'auth-true' : 'auth-false'}
          results={response}
        />
        {searchConfigs.length > 0 ? (
          <Box
            sx={{
              display: {
                xs: 'none',
                sm: 'none',
                md: 'block',
                sm: 'block',
              },
              color: 'white',
              margin: '-36px auto',
              width: 'auto',
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <FormControl
              variant="standard"
              sx={{ width: '100%', margin: '13px 0px 0px 0px' }}
              size="small"
            >
              <Select
                label="Save Filters"
                disabled={isInprogress}
                disableUnderline
                sx={{
                  color: 'inherit',
                  borderRadius: '0px',
                  textAlign: 'center',
                  fontSize: '18px',
                  padding: '10px',
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                }}
                labelId="saved-filters-select-small-label"
                id="savefilters-select-small"
                // kekny ganti dsninya deh
                value={
                  selectedSavedConfig?.Id ||
                  searchConfigs[searchConfigs.length - 1]?.Id
                }
                onChange={handleSaveFilterSelectChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: '350px', // Adjust the maximum height here
                    },
                  },
                }}
              >
                <MenuItem key="globalfilesearch" value="globalfilesearch">
                  Global File Search
                </MenuItem>
                {searchConfigs.map((item, index) => (
                  <MenuItem key={index} value={item?.Id}>
                    {item?.Title} &nbsp;
                    {item.ConfigType && (
                      <Chip
                        variant="outlined"
                        label={item?.ConfigType}
                        sx={{ fontSize: '12px', fontWeight: 500 }}
                      />
                    )}
                  </MenuItem>
                ))}
                {/* this will open the dialog */}
                <MenuItem
                  sx={{ color: 'rgb(41, 152, 111)' }}
                  key="searchConfigs"
                  value="searchConfigs"
                >
                  <SettingsIcon
                    sx={{
                      color: 'rgb(41, 152, 111)',
                      margin: '0px 5px 0px -8px',
                    }}
                  />{' '}
                  Configure Saved Views
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : searchFileName !== null && searchFileName !== '' ? (
          <div
            style={{
              color: 'white',
              margin: '-36px auto',
              width: 'auto',
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <FormControl
              variant="standard"
              sx={{ width: '100%', margin: '13px 0px 0px 0px' }}
              size="small"
            >
              <Select
                disabled={isInprogress}
                disableUnderline
                sx={{
                  color: 'inherit',
                  borderRadius: '0px',
                  textAlign: 'center',
                  fontSize: '18px',
                  padding: '10px',
                }}
                labelId="saved-filters-select-small-label"
                id="savefilters-select-small"
                value={'globalfilesearch'}
                label="Save Filters"
                onChange={handleSaveFilterSelectChange}
              >
                <MenuItem key="globalfilesearch" value="globalfilesearch">
                  Global File Search
                </MenuItem>
              </Select>
            </FormControl>
          </div>
        ) : (
          <Box
            sx={{
              display: {
                xs: 'none',
                sm: 'none',
                md: 'block',
                sm: 'block',
              },
              fontSize: '18px',
              color: 'white',
              margin: '-35px auto',
              width: 'auto',
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            No Saved Search Criteria
          </Box>
        )}
      </div>

      {isAuth !== false ? (
        authBarView ? (
          <Alert severity="info">
            <strong>Authenticated as: </strong> {isAuth.account.name} -{' '}
            {isAuth.account.username}{' '}
          </Alert>
        ) : (
          <></>
        )
      ) : (
        <p
          style={{
            color: 'rgb(41, 152, 111)',
            fontWeight: '800',
            width: '100%',
            textAlign: 'center',
          }}
        >
          Verifying Access.. Please Wait..
        </p>
      )}

      {errMessageStr}

      <WarningDialog
        alertText={noticeSnackMsg}
        open={noticeSnackIsOpen}
        setOpen={setNoticeSnackIsOpen}
      />

      <Box>
        <Grid container>
          <CollapsableSidebar
            isSearchCriteriaVisible={isSearchCriteriaVisible}
            setIsSearchCriteriaVisible={setIsSearchCriteriaVisible}
            handleSearchCriteriaVisibleClick={handleSearchCriteriaVisibleClick}
            handleSearchFilesClick={handleSearchFilesClick}
            handleSaveClick={handleSaveClick}
            isSavedSearchConfigOpen={isSavedSearchConfigOpen}
            setIsSavedSearchConfigOpen={setIsSavedSearchConfigOpen}
            isInProgressSavingConfig={isInProgressSavingConfig}
            searchConfigs={searchConfigs}
            setSelectedSavedConfig={setSelectedSavedConfig}
            handleSaveFilterSelectChange={handleSaveFilterSelectChange}
            setSavedSearchConfigNameText={setSavedSearchConfigNameText}
            savedFilterConfigCurDefault={savedFilterConfigCurDefault}
            selectedSavedConfig={selectedSavedConfig}
            userType={userType}
            filter={filter}
            grouping={grouping}
            handleSaveSearchConfigActionBtnClick={
              handleSaveSearchConfigActionBtnClick
            }
            approvalPageTableOrderBy={approvalPageTableOrderBy}
            setMinorVersionIframePropRaw={setMinorVersionIframePropRaw}
            isNewConfigType={isNewConfigType}
            savedSearchConfigNameText={savedSearchConfigNameText}
            handleSavedSearchConfigNameTextChange={
              handleSavedSearchConfigNameTextChange
            }
            savedSearchConfigNameTextInput={savedSearchConfigNameTextInput}
            isSavedSearchConfigType={isSavedSearchConfigType}
            setIsSavedSearchConfigType={setIsSavedSearchConfigType}
            handleSavedSearchConfigTypeChange={
              handleSavedSearchConfigTypeChange
            }
            filterGroup={filterGroup}
            handleGroupingChange={handleGroupingChange}
            termsMapData={termsMapData}
            setIsNewConfigType={setIsNewConfigType}
            handleSaveSearchConfigClick={handleSaveSearchConfigClick}
            isMinorVersionListOpen={isMinorVersionListOpen}
            setIsMinorVersionListOpen={setIsMinorVersionListOpen}
            isInProgressMinorVersionList={isInProgressMinorVersionList}
            isErrorMinorVersions={isErrorMinorVersions}
            isError={isError}
            isMinorVersionUpdated={isMinorVersionUpdated}
            minorVersionsResortTarget={minorVersionsResortTarget}
            handleMinorVersionResortSelectChange={
              handleMinorVersionResortSelectChange
            }
            accessibleResortsSanitized={accessibleResortsSanitized}
            handleSearchMinorVersionTextInputChange={
              handleSearchMinorVersionTextInputChange
            }
            searchMinorVersionTextInput={searchMinorVersionTextInput}
            getPendingDraftVersions={getPendingDraftVersions}
            approvalPageTableOrder={approvalPageTableOrder}
            handleSortApprovalPageTable={handleSortApprovalPageTable}
            sortedData={sortedData}
            handleViewFileContentActionClick={handleViewFileContentActionClick}
            versionFileStatusMapping={versionFileStatusMapping}
            minorVersionIframePropRaw={minorVersionIframePropRaw}
            termsGuidToLabel={termsGuidToLabel}
            termsMapCTData={termsMapCTData}
            minorVersions={minorVersions}
            minorVersionIframeSrc={minorVersionIframeSrc}
            minorVersionIframeSrcTitle={minorVersionIframeSrcTitle}
            setMinorVersionIframeSrc={setMinorVersionIframeSrc}
            setMinorVersionIframeSrcTitle={setMinorVersionIframeSrcTitle}
            setIsInProgressMinorVersionList={setIsInProgressMinorVersionList}
            accessibleResorts={accessibleResorts}
            minorVersionIframeProp={minorVersionIframeProp}
            setMinorVersionIframeProp={setMinorVersionIframeProp}
            isMinorVersionCommentsOpen={isMinorVersionCommentsOpen}
            setIsMinorVersionCommentsOpen={setIsMinorVersionCommentsOpen}
            draftCommentTextInput={draftCommentTextInput}
            handleMinorVersionResortActionClick={
              handleMinorVersionResortActionClick
            }
            handleRejectModalOpen={handleRejectModalOpen}
            handleRejectModalClose={handleRejectModalClose}
            rejectReason={rejectReason}
            handleChangeReason={handleChangeReason}
            openRejectModal={openRejectModal}
            setExpandedFilter={setExpandedFilter}
            expandedFilter={expandedFilter}
            termsDataLocal={termsDataLocal}
            handleSelectFilterChangeParent={handleSelectFilterChangeParent}
            isInprogress={isInprogress}
            searchFileName={searchFileName}
            handleSelectFilterChange={handleSelectFilterChange}
            checkIfChecked={checkIfChecked}
            filterNullOveride={filterNullOveride}
            minorVersionComments={minorVersionComments}
            minorVersionsNextUrl={minorVersionsNextUrl}
            cancelAllPendingDraftVersionLongPullingRequests={
              cancelAllPendingDraftVersionLongPullingRequests
            }
            controllerDraftApprovalFetchsRef={controllerDraftApprovalFetchsRef}
            setMinorVersions={setMinorVersions}
            setMinorVersionsRaw={setMinorVersionsRaw}
            minorVersionsRaw={minorVersionsRaw}
          />
          <Grid
            size={isSearchCriteriaVisible ? 10 : 12}
            sx={{ flexGrow: 1, px: '10px', width: '40%' }}
          >
            {isInprogress ? (
              <LinearProgress />
            ) : (
              <>
                {isSmallScreen ? (
                  <SmallScreenMenus
                    isSearchCriteriaVisible={isSearchCriteriaVisible}
                    handleSearchCriteriaVisibleClick={
                      handleSearchCriteriaVisibleClick
                    }
                    accessibleResortsSanitized={accessibleResortsSanitized}
                    filter={filter}
                    userType={userType}
                    handleMinorVersionListOpenClick={
                      handleMinorVersionListOpenClick
                    }
                    searchFileName={searchFileName}
                    searchFileNameTextInputFocused={
                      searchFileNameTextInputFocused
                    }
                    isInprogress={isInprogress}
                    handleSearchEnterKeyDown={handleSearchEnterKeyDown}
                    handleSearchFileNameTextInputChange={
                      handleSearchFileNameTextInputChange
                    }
                    filterGroup={filterGroup}
                    response={response}
                    handleFilterChange={handleFilterChange}
                    searchTextInput={searchTextInput}
                    grouping={grouping}
                    handleGroupingChange={handleGroupingChange}
                    termsMapData={termsMapData}
                    searchFileNameTextInput={searchFileNameTextInput}
                    searchConfigs={searchConfigs}
                    selectedSavedConfig={selectedSavedConfig}
                    isSavedFilterModified={isSavedFilterModified}
                    handleSaveFilterSelectChange={handleSaveFilterSelectChange}
                  />
                ) : (
                  <div
                    style={{
                      margin: '10px 0px 0px 0px',
                      minHeight: '60px',
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    {isSearchCriteriaVisible ? (
                      <></>
                    ) : (
                      <FilterListIcon
                        onClick={handleSearchCriteriaVisibleClick}
                        sx={{
                          paddingRight: '10px',
                          margin: '0px -10px 0px 7px',
                          cursor: 'pointer',
                        }}
                      />
                    )}

                    {accessibleResortsSanitized.length > 0 && (
                      <BulkUploadDialog icon={<UploadFile />} />
                    )}

                    {accessibleResortsSanitized.length <= 0 ? (
                      <></>
                    ) : (
                      <Tooltip title="Document Approvals">
                        <AdminPanelSettingsIcon
                          onClick={handleMinorVersionListOpenClick}
                          style={{
                            borderLeft: '1px solid gray',
                            cursor: 'pointer',
                            padding: '0px 0px 0px 8px',
                          }}
                        ></AdminPanelSettingsIcon>
                      </Tooltip>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        width: '45%',
                        justifyContent: 'center',
                      }}
                    >
                      <FormControl fullWidth>
                        <TextField
                          focused={searchFileNameTextInputFocused}
                          placeholder="Filename or document content to search"
                          value={searchFileName || null}
                          onKeyDown={handleSearchEnterKeyDown}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': { borderRadius: 0 },
                          }}
                          disabled={isInprogress}
                          id="fileNameSearch"
                          label="Global File Search"
                          size="small"
                          onChange={handleSearchFileNameTextInputChange}
                          inputRef={searchFileNameTextInput}
                        />
                      </FormControl>
                    </div>
                    <TextField
                      placeholder="Filter name to narrow down the results below"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        width: '50%',
                        flex: 1,
                        '& .MuiOutlinedInput-root': { borderRadius: 0 },
                      }}
                      disabled={Object.keys(filterGroup).length <= 0}
                      size="small"
                      id="outlined-search"
                      label={
                        response.length <= 0
                          ? 'Filter'
                          : `Filter from ${response.length} results`
                      }
                      type="search"
                      onChange={handleFilterChange}
                      inputRef={searchTextInput}
                    />
                    <FormControl size="small">
                      <InputLabel id="groupby-select-small-label">
                        Group by
                      </InputLabel>
                      <Select
                        sx={{
                          color: 'inherit',
                          borderRadius: '0px',
                          margin: '0px 5px 0px 0px',
                        }}
                        disabled={Object.keys(filterGroup).length <= 0}
                        labelId="groupby-select-small-label"
                        id="demo-select-small"
                        value={grouping}
                        label="Group By"
                        onChange={handleGroupingChange}
                      >
                        {Object.keys(termsMapData).map((key) =>
                          key.includes('Revision Number') ||
                          key.includes('Short Description') ? (
                            <React.Fragment key={key}></React.Fragment>
                          ) : (
                            <MenuItem key={key} value={key}>
                              {key}
                            </MenuItem>
                          ),
                        )}
                      </Select>
                    </FormControl>
                  </div>
                )}

                {response.length > 0 && Object.keys(filterGroup).length > 0 ? (
                  <Grid1
                    container
                    spacing={3}
                    sx={{
                      px: {
                        xs: 0,
                        sm: 0,
                        md: 0,
                        lg: 3,
                      },
                    }}
                  >
                    <BulkDownloadBar
                      filterGroup={filterGroup}
                      response={response}
                    />

                    {Object.keys(filterGroup)
                      .toSorted((a, b) => naturalCompare(a, b))
                      .map((key, filterIdx) => {
                        const groupCount = Object.keys(filterGroup).length;
                        const isSingleOrDoubleGroup =
                          groupCount === 1 || groupCount === 2;

                        return (
                          <Grid1
                            key={key}
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            lg={groupCount === 1 ? 12 : 6}
                          >
                            <DataFilterItem
                              isSearchCriteriaVisible={isSearchCriteriaVisible}
                              accessibleResortsSanitized={
                                accessibleResortsSanitized
                              }
                              accessibleResorts={accessibleResorts}
                              getNextKeyItem={getNextKeyItem}
                              getNextKeySection={getNextKeySection}
                              getPreviousKeySection={getPreviousKeySection}
                              onOpenModal={onOpenModal}
                              onCloseModal={onCloseModal}
                              formatTitle={formatTitle}
                              filterGroup={filterGroup}
                              response={response}
                              grouping={grouping}
                              userType={userType}
                              showModal={showModal}
                              filter={filter}
                              rowKey={key}
                              isSingleOrDoubleGroup={isSingleOrDoubleGroup}
                            />
                          </Grid1>
                        );
                      })}
                  </Grid1>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: '70vh' }}
                  >
                    No Document Available
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Box>
      <BulkDownloadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        content={modalContent}
        onConfirm={modalActions}
        fileStatus={downloadableStatus}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbar?.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ open: false, severity: 'success', message: '' })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar?.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default MainPage;
