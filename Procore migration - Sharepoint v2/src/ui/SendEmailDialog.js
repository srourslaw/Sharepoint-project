import React, { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Autocomplete,
  IconButton,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../apis';
import { Controller, useForm } from 'react-hook-form';
import useRenewToken from '../hooks/useRenewToken';
import { useParams } from 'react-router-dom';

const SendEmailDialog = ({
  filePath,
  siteName,
  open = false,
  onClose = () => {},
}) => {
  const { docId } = useParams();

  const { handleSubmit, control } = useForm({
    defaultValues: {
      recipients: [],
      subject: '',
      body: '',
    },
    shouldUnregister: true,
  });

  const [recipientOptions, setRecipientOptions] = useState([]);
  const [recipientsQuery, setRecipientsQuery] = useState('');

  const { getAccessToken } = useRenewToken();

  const getOrganisationUsers = async () => {
    const accessToken = await getAccessToken();
    try {
      const response = await api({
        baseURL: `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com/sites`,
        accessToken,
      }).get(`/${process.env.REACT_APP_HUB_NAME}/_api/web/siteusers`);
      const mappedResults = response.data?.d?.results
        ?.filter((res) => res.Title && res.Email)
        .map((res) => `${res?.Title} <${res?.Email}>`);
      setRecipientOptions(mappedResults);
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    if (open) {
      getOrganisationUsers();
    }
  }, [open]);

  function handleOnSubmit({ recipients, subject, body }) {
    const [_, fileName] = filePath.split(siteName);
    const encodedSiteName = encodeURI(siteName);
    const encodedFilename = encodeURIComponent(fileName);

    const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Message: ${body}\nFile Link: ${process.env.REACT_APP_DMS_URL}/main/view/${docId}`,
    )}`;
    window.open(mailtoLink);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        textAlign="center"
        sx={{
          backgroundColor: 'rgb(41, 152, 111)',
          color: 'white',
          fontWeight: '800',
        }}
      >
        Send email to
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 10,
            top: 10,
            color: '#FFF',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleOnSubmit)}>
          <Grid container sx={{ pt: 4, pb: 1 }} spacing={2}>
            <Grid item xs={12} md={12} lg={12}>
              <Controller
                name="recipients"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Autocomplete
                    autoHighlight
                    autoSelect
                    filterSelectedOptions
                    multiple
                    size="small"
                    options={
                      recipientsQuery.length >= 3 ? recipientOptions : []
                    }
                    noOptionsText={
                      recipientsQuery.length >= 3
                        ? 'No personnel found'
                        : 'Search by typing at least 3 characters'
                    }
                    value={field.value}
                    onChange={(_, values) => {
                      setRecipientsQuery('');
                      field.onChange(values);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Recipients"
                        variant="outlined"
                        value={recipientsQuery}
                        onChange={(e) => setRecipientsQuery(e.target.value)}
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                    fullWidth
                  />
                )}
                rules={{
                  required: 'Recipient(s) is required',
                }}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <Controller
                control={control}
                name="subject"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    size="small"
                    label="Subject"
                    fullWidth
                    error={!!error}
                    helperText={error?.message}
                    {...field}
                  />
                )}
                rules={{
                  min: 1,
                  required: 'Subject is required',
                }}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <Controller
                control={control}
                name="body"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    size="small"
                    label="Body"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!error}
                    helperText={error?.message}
                    {...field}
                  />
                )}
                rules={{
                  min: 1,
                  required: 'Body is required',
                }}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ bgcolor: 'rgb(41, 152, 111)' }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailDialog;
