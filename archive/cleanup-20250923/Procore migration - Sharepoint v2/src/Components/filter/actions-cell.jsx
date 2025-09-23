import { TableCell, Tooltip } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';

export function FilterActionsCell({
  row,
  handleSaveSearchConfigActionBtnClick,
  savedFilterConfigCurDefault,
  userType,
}) {
  if (row?.modified) {
    return null;
  }

  return (
    <TableCell
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Tooltip placement="right" title="Set Default">
        <BookmarkAddedIcon
          onClick={() => {
            handleSaveSearchConfigActionBtnClick(row?.Id, 'default');
          }}
          sx={{
            cursor:
              savedFilterConfigCurDefault == row?.Id
                ? 'not-allowed'
                : 'pointer',
            color: savedFilterConfigCurDefault == row?.Id ? 'gray' : 'black',
          }}
        />
      </Tooltip>

      {row?.ConfigType === 'Personal' || userType === 2 ? (
        <Tooltip placement="right" title="Delete">
          <RemoveCircleOutlineIcon
            onClick={() => {
              handleSaveSearchConfigActionBtnClick(row?.Id, 'delete');
            }}
            sx={{
              margin: '0px 0px 0px 5px',
              cursor: 'pointer',
              color: 'red',
            }}
          />
        </Tooltip>
      ) : (
        <></>
      )}
    </TableCell>
  );
}
