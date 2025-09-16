import { UploadFile } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid2,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Typography,
  Box,
  FormHelperText,
} from '@mui/material';
import {
  createContext,
  Fragment,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { filesSchema } from './schema';
import { UploadDropzone } from './upload-dropzone';
import { UploadForm } from './upload-form';
import { Close } from '@mui/icons-material';
import { Check } from '@mui/icons-material';
import { useBulkUploadStore } from './bulk-upload-store';
import { Info } from '@mui/icons-material';
import { useShallow } from 'zustand/react/shallow';
import { useDialog } from '../../context/dialog-provider';
import { validateFileUpload } from '../../utils/helpers';

const BulkUploadDialogHeader = memo(function BulkUploadDialogHeader() {
  // const handleClose = useBulkUploadStore((state) => state.handleClose);
  const { handleClose } = useContext(BulkUploadDialogContext);

  return (
    <Grid2
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        position: 'relative',
        height: '50px',
        backgroundColor: 'rgb(41, 152, 111)',
      }}
    >
      <DialogTitle
        sx={{
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        File Upload
      </DialogTitle>

      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
        }}
      >
        <Close
          sx={{
            color: 'white',
          }}
        />
      </IconButton>
    </Grid2>
  );
});

const BulkUploadFileChip = memo(function BulkUploadFileChip({
  succeedFileId,
  field,
  onDelete,
  index,
}) {
  const { selectedFile, setSelectedFile } = useBulkUploadStore(
    useShallow(({ selectedFile, setSelectedFile }) => ({
      selectedFile,
      setSelectedFile,
    })),
  );
  const isUploaded = succeedFileId.includes(field.id);
  const isSelected = selectedFile?.id === field.id;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Box
        onClick={() => {
          if (isUploaded) return;
          setSelectedFile(field);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          cursor: isUploaded ? 'default' : 'pointer',
          flexGrow: 1,
          paddingInline: '4px',
          color: isUploaded ? 'gray' : isSelected ? 'white' : 'black',
          backgroundColor: isUploaded
            ? 'white'
            : isSelected
              ? 'rgba(41, 152, 111)'
              : 'white',
        }}
      >
        <Typography>{index + 1}.</Typography>
        {isUploaded ? (
          <Tooltip title={`${field.file.name} is already uploaded.`}>
            <Typography sx={{ wordBreak: 'break-all' }}>
              {field.file.name}
            </Typography>
          </Tooltip>
        ) : (
          <Typography
            sx={{
              flexGrow: 1,
              wordBreak: 'break-all',
            }}
          >
            {field.file.name}
          </Typography>
        )}
      </Box>
      {isUploaded ? (
        <Check fontSize="small" sx={{ color: 'rgba(41, 152, 111)' }} />
      ) : (
        <Close
          onClick={onDelete}
          color="error"
          fontSize="small"
          sx={{ cursor: 'pointer', marginLeft: 'auto' }}
        />
      )}
    </Box>
  );
});

const BulkUploadDialogContent = memo(function BulkUploadDialogContent() {
  const { control } = useForm({
    resolver: zodResolver(filesSchema),
    defaultValues: {
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'documents',
    control,
  });

  const setIsAllFileSuccessfullyUploaded = useBulkUploadStore(
    (state) => state.setIsAllFileSuccessfullyUploaded,
  );
  const selectedFile = useBulkUploadStore((state) => state.selectedFile);
  const setSelectedFile = useBulkUploadStore((state) => state.setSelectedFile);
  const formValues = useBulkUploadStore((state) => state.formValues);
  const setUploadError = useBulkUploadStore((state) => state.setUploadError);
  const setSelectedFiles = useBulkUploadStore(
    (state) => state.setSelectedFiles,
  );

  const [succeedFileId, setSucceedFileId] = useState([]);

  // auto-select on append
  useEffect(() => {
    if (fields.length !== succeedFileId.length && !selectedFile) {
      setSelectedFile(
        fields.find((field) => !succeedFileId.includes(field.id)),
      );
    }
  }, [fields, succeedFileId]);

  useEffect(() => {
    if (succeedFileId.length && fields.length) {
      setIsAllFileSuccessfullyUploaded(succeedFileId.length === fields.length);
    }
  }, [succeedFileId, fields]);

  useEffect(() => {
    if (fields.length) {
      setSelectedFiles(fields);
    }
  }, [fields]);

  // if there is file, auto-select the next file
  function determineSelectedFile(successFields) {
    if (!fields.length) {
      setSelectedFile(null);
      return;
    }

    const selectedIndex = fields.findIndex(
      (field) => field.id === selectedFile.id,
    );

    const isSucceeded = (field) => successFields.includes(field.id);

    // continue to iterate until fields id does not exist on succeed, but starts from the selectedIndex
    const nextFile =
      // Check from selectedIndex + 1 to end
      fields.slice(selectedIndex + 1).find((field) => !isSucceeded(field)) ??
      // Wrap around: check from 0 to selectedIndex
      fields.slice(0, selectedIndex).find((field) => !isSucceeded(field)) ??
      null;

    setSelectedFile(nextFile);
  }

  function handleOnSuccess() {
    const updatedSucceddFileId = [...succeedFileId, selectedFile.id];
    setSucceedFileId(updatedSucceddFileId);
    determineSelectedFile(updatedSucceddFileId);
  }

  const handleAppend = (file) => {
    append({ file });
  };

  const handleDelete = (index) => {
    const isDeleteSelectedFile = fields[index].id === selectedFile.id;
    if (isDeleteSelectedFile) {
      determineSelectedFile(succeedFileId);
    }
    remove(index);
  };

  useEffect(() => {
    if (
      selectedFile &&
      formValues['Document Type']?.includes('Drawing') &&
      validateFileUpload(selectedFile.file)
    ) {
      setUploadError(validateFileUpload(selectedFile.file));
    } else {
      setUploadError('');
    }
  }, [selectedFile, formValues]);

  return (
    <DialogContent>
      <Grid2
        container
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '8px',
          marginBottom: '8px',
          flexWrap: {
            sm: 'nowrap',
          },
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
        }}
      >
        {fields.length > 0 && (
          <div
            style={{
              flex: 1,
              flexBasis: '100%',
              flexGrow: 1,
              border: '2px dashed #bdbdbd',
            }}
          >
            <Stack
              spacing={1}
              sx={{
                overflowY: 'auto',
                padding: '8px',
                height: '142px',
              }}
            >
              {fields.map((field, index) => (
                <BulkUploadFileChip
                  key={field.id}
                  succeedFileId={succeedFileId}
                  field={field}
                  onDelete={() => {
                    handleDelete(index);
                  }}
                  index={index}
                />
              ))}
            </Stack>
          </div>
        )}

        <Grid2 sx={{ flexShrink: 1, flexGrow: 1, minWidth: '275px' }}>
          <UploadDropzone handleAppend={handleAppend} />
        </Grid2>
      </Grid2>

      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{
              fontWeight: '800',
              color: 'rgb(41, 152, 111)',
            }}
          >
            Please fill out document tags
          </Typography>
          <Tooltip title="You should process files in sequential order of list in the upload box. Only metadata that is submitted will be processed and moved to the next file for upload convenience. Jumping over to different files will remove any updated metadata except last submitted information">
            <Info
              sx={{
                ml: '4px',
                color: 'rgb(41, 152, 111)',
              }}
            />
          </Tooltip>
        </Box>
        <UploadForm onSuccess={handleOnSuccess} />
      </Stack>
    </DialogContent>
  );
});

export const BulkUploadDialogContext = createContext({
  handleClose: () => {},
});

export function BulkUploadDialog({ icon }) {
  const { openDialog } = useDialog();
  const {
    hidden,
    setHidden,
    selectedFile,
    isAllFileSuccessfullyUploaded,
    resetStore,
    open,
    setOpen,
  } = useBulkUploadStore(
    useShallow((state) => ({
      hidden: state.hidden,
      setHidden: state.setHidden,
      selectedFile: state.selectedFile,
      isAllFileSuccessfullyUploaded: state.isAllFileSuccessfullyUploaded,
      resetStore: state.resetStore,
      open: state.open,
      setOpen: state.setOpen,
    })),
  );

  function handleOpen() {
    setHidden(false);
    setOpen(true);
  }

  function handleClose() {
    // immediately close when all file are uploaded, OR file is empty.
    if (!selectedFile || isAllFileSuccessfullyUploaded) {
      setOpen(false);
      setHidden(true);
      resetStore();
      return;
    }

    // show alert dialog if some files aren't uploaded.
    openDialog({
      title: 'Confirmation',
      description:
        'Are you sure you want to leave without uploading all the added files? Only submitted files will be uploaded.',
      confirmText: 'OK',
      onConfirm: () => {
        setOpen(false);
        resetStore();
      },
    });
  }

  return (
    <BulkUploadDialogContext.Provider value={{ handleClose }}>
      <Tooltip title="Upload New File">
        <IconButton onClick={handleOpen}>{icon}</IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        fullWidth
        maxWidth="xl"
        hidden={hidden}
      >
        <BulkUploadDialogHeader />
        <BulkUploadDialogContent />
      </Dialog>
    </BulkUploadDialogContext.Provider>
  );
}
