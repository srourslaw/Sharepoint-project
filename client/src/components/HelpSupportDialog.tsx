import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Divider,
  Chip,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Help as HelpIcon,
  ContactSupport as ContactIcon,
  Description as DocsIcon,
  VideoLibrary as VideoIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  BugReport as BugReportIcon,
  Feedback as FeedbackIcon,
  School as TutorialIcon,
} from '@mui/icons-material';

interface HelpSupportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

export const HelpSupportDialog: React.FC<HelpSupportDialogProps> = ({
  open,
  onClose
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [supportForm, setSupportForm] = useState({
    type: 'general',
    subject: '',
    message: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmitSupport = () => {
    console.log('Support request submitted:', supportForm);
    // Here you would typically send to backend
    alert('Support request submitted! We will get back to you soon.');
    setSupportForm({ type: 'general', subject: '', message: '' });
  };

  const faqs = [
    {
      question: "How do I access SharePoint files?",
      answer: "Navigate using the sidebar to browse your SharePoint sites and libraries. Click on any folder to explore its contents."
    },
    {
      question: "What AI features are available?",
      answer: "The AI panel (right side) provides document summarization, content analysis, and intelligent Q&A. Select documents and use the AI assistant for insights."
    },
    {
      question: "How do I use the search functionality?",
      answer: "Use the search bar in the main content area for real-time filtering, or use the global search in the sidebar for comprehensive results."
    },
    {
      question: "Can I download multiple files at once?",
      answer: "Yes! Select multiple files using checkboxes, then right-click or use the context menu for batch operations including downloads."
    },
    {
      question: "How do I change my display preferences?",
      answer: "Go to Settings (gear icon in sidebar) to customize your theme, language, notifications, and other display preferences."
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Help & Support
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="FAQ" icon={<HelpIcon />} />
          <Tab label="Documentation" icon={<DocsIcon />} />
          <Tab label="Contact Support" icon={<ContactIcon />} />
          <Tab label="Tutorials" icon={<VideoIcon />} />
        </Tabs>
      </Box>

      <DialogContent>
        {/* FAQ Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500 }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        {/* Documentation Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Documentation & Resources
          </Typography>
          <List>
            <ListItem button component="a" href="/docs/guides/USER_GUIDE.md" target="_blank">
              <ListItemIcon>
                <DocsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="User Guide"
                secondary="Complete guide for using all dashboard features"
              />
            </ListItem>
            <ListItem button component="a" href="/docs/guides/QUICK_START.md" target="_blank">
              <ListItemIcon>
                <TutorialIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Quick Start Guide"
                secondary="Get up and running in 5 minutes"
              />
            </ListItem>
            <ListItem button component="a" href="/docs/api/API_REFERENCE.md" target="_blank">
              <ListItemIcon>
                <DocsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="API Documentation"
                secondary="Technical reference for developers"
              />
            </ListItem>
            <ListItem button onClick={() => window.open('https://www.thakralone.com', '_blank')}>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Thakral One Website"
                secondary="Visit our main website for more information"
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Contact Support Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Contact Support
          </Typography>

          {/* Contact Methods */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Get in Touch
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Card sx={{ minWidth: 200, cursor: 'pointer' }} onClick={() => window.location.href = 'mailto:support@thakralone.com'}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EmailIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Email</Typography>
                  <Typography variant="body2" color="text.secondary">
                    support@thakralone.com
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ChatIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Live Chat</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available 9 AM - 5 PM
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Support Form */}
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Submit Support Request
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Request Type"
              value={supportForm.type}
              onChange={(e) => setSupportForm({...supportForm, type: e.target.value})}
            >
              <MenuItem value="general">General Question</MenuItem>
              <MenuItem value="technical">Technical Issue</MenuItem>
              <MenuItem value="bug">Bug Report</MenuItem>
              <MenuItem value="feature">Feature Request</MenuItem>
            </TextField>
            <TextField
              label="Subject"
              value={supportForm.subject}
              onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
            />
            <TextField
              label="Message"
              multiline
              rows={4}
              value={supportForm.message}
              onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
              placeholder="Please describe your issue or question in detail..."
            />
            <Button
              variant="contained"
              onClick={handleSubmitSupport}
              disabled={!supportForm.subject || !supportForm.message}
              startIcon={<ContactIcon />}
            >
              Submit Request
            </Button>
          </Box>
        </TabPanel>

        {/* Tutorials Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Video Tutorials & Guides
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <VideoIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">Getting Started</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Learn the basics of navigating the SharePoint AI Dashboard
                    </Typography>
                    <Chip label="5 min" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <VideoIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">Using AI Features</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maximize productivity with AI document analysis and chat
                    </Typography>
                    <Chip label="8 min" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <VideoIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">File Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Organize, search, and manage your SharePoint files efficiently
                    </Typography>
                    <Chip label="12 min" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};