import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatUniqueId } from '../utils/helpers';
import { PropertyContext } from '../context/PropertyProvider';
import { useSnackbar } from '../context/snackbar-provider';
import { ALERT_SEVERITY } from '../const/common';

export default function useShowModal() {
  const navigate = useNavigate();
  const { setOpenTags } = useContext(PropertyContext);
  const [currentModal, setCurrentModal] = useState(null);
  const { showSnackbar } = useSnackbar();
  const onOpenModal = (itemData) => {
    if (!itemData) {
      showSnackbar({
        message:
          'Document not found. It may be still being processed or does not exist.',
        severity: ALERT_SEVERITY.ERROR,
      });
    } else {
      const uniqueId = itemData.Cells.find(
        (cell) => cell.Key === 'UniqueId',
      )?.Value;
      setCurrentModal(itemData);
      navigate(`/main/view/${formatUniqueId(uniqueId)}`);
    }
  };
  const onCloseModal = () => {
    setCurrentModal(null);
    navigate('/main');
    setOpenTags(true);
  };

  const showModal = (itemData) => itemData === currentModal;

  return {
    showModal,
    onOpenModal,
    onCloseModal,
  };
}
