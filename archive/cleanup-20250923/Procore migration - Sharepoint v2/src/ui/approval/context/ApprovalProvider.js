import { createContext, useState } from 'react';

export const ApprovalContext = createContext({});

export function ApprovalProvider({ children }) {
  const [approvalDetails, setApprovalDetails] = useState(null);
  const [rowDetails, setRowDetails] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [filter, setFilter] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [approvalList, setApprovalList] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
  });

  return (
    <ApprovalContext.Provider
      value={{
        approvalDetails,
        setApprovalDetails,
        rowDetails,
        setRowDetails,
        selectedStatus,
        setSelectedStatus,
        filter,
        setFilter,
        isEdit,
        setIsEdit,
        approvalList,
        setApprovalList,
        snackbar,
        setSnackbar,
      }}
    >
      {children}
    </ApprovalContext.Provider>
  );
}
