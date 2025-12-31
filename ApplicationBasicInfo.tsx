import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from '../../api/axiosInterceptor';
 
/* ================= TYPES ================= */
type UWStatus = "UW Ready" | "UW In Progress" | "UW Complete";
 
interface ApplicationData {
  clientName: string;
  clientNo: string;
  quotationNumber: string;
  quotationDate: string;
  applicationNumber: string;
  productName: string;
  sumAssured: string;
  annualPremium: string;
  issueDate: string;
  tobacco: string;
  issueAge: string;
  uwClass: string;
}
 
interface RiderData {
  coverageAmount: string;
  startDate: string;
  endDate: string;
}
 
interface FormData {
  application: ApplicationData;
  adbRider: RiderData;
  waiverRider: RiderData;
}
 
/* ================= COMPONENT ================= */
const ApplicationBasicInfo: React.FC = () => {
  const { txnTypeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
 
  const [loading, setLoading] = useState(true);
 
  /* ===== DATA FROM SCREEN 1 ===== */
  const policyData: any = location.state?.policyData;
 
  /* ===== FORM DATA ===== */
  const [formData, setFormData] = useState<FormData>({
    application: {
      clientName: '',
      clientNo: '',
      quotationNumber: '',
      quotationDate: '',
      applicationNumber: '',
      productName: 'TERM LIFE INSURANCE',
      sumAssured: '',
      annualPremium: '',
      issueDate: '',
      tobacco: '',
      issueAge: '',
      uwClass: ''
    },
    adbRider: {
      coverageAmount: '',
      startDate: '',
      endDate: ''
    },
    waiverRider: {
      coverageAmount: '',
      startDate: '',
      endDate: ''
    }
  });

  /* ===== UW CLASS OPTIONS ===== */
  const uwClassOptions = [
    'Preferred Plus',
    'Preferred',
    'Standard Plus',
    'Standard',
    'Substandard'
  ];
 
  /* ===== UW STATUS (backend later) ===== */
  const uwStatus: UWStatus = "UW In Progress";
 
  /* ===== EDIT RULE ===== */
  const editable = uwStatus !== "UW Complete";
 
  const mapBackendToState = (backendData: any): FormData => {
    return {
      application: {
        clientName: '',
        clientNo: '',
        quotationNumber: backendData.policyId || '',
        quotationDate: '',
        applicationNumber: backendData.policyId || '',
        productName: 'TERM LIFE INSURANCE',
        sumAssured: backendData.sa?.toString() || '',
        annualPremium: backendData.periodPrem?.toString() || '',
        issueDate: '',
        tobacco: '',
        issueAge: '',
        uwClass: ''
      },
      adbRider: {
        coverageAmount: '',
        startDate: '',
        endDate: ''
      },
      waiverRider: {
        coverageAmount: '',
        startDate: '',
        endDate: ''
      }
    };
  };

  const fetchCoverageData = async (policyId: string) => {
    try {
      // Fetch coverage data from UW_Coverage table
      const response = await axios.get(`http://localhost:8001/eapp/getCoverage?policyId=${policyId}`);
      const coverageData = response.data;
      
      // Assuming coverageData is an array of coverage records
      // Filter for ADB and Waiver riders
      const adbCoverage = coverageData.find((coverage: any) => coverage.riderType === 'ADB' || coverage.riderType === 'Accidental Death Benefit');
      const waiverCoverage = coverageData.find((coverage: any) => coverage.riderType === 'Waiver' || coverage.riderType === 'Waiver of Premium');
      
      if (adbCoverage) {
        setFormData(prev => ({
          ...prev,
          adbRider: {
            coverageAmount: adbCoverage.coverageAmount?.toString() || adbCoverage.amount?.toString() || '',
            startDate: adbCoverage.startDate || '',
            endDate: adbCoverage.endDate || ''
          }
        }));
      }
      
      if (waiverCoverage) {
        setFormData(prev => ({
          ...prev,
          waiverRider: {
            coverageAmount: waiverCoverage.coverageAmount?.toString() || waiverCoverage.amount?.toString() || '',
            startDate: waiverCoverage.startDate || '',
            endDate: waiverCoverage.endDate || ''
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching coverage data:', error);
      // Silently handle error, coverage data might not exist
    }
  };

  const fetchSmokingStatus = async (policyId: string) => {
    try {
      // Fetch smoking status from eApp
      const response = await axios.get(`http://localhost:8001/eapp/getSmokingStatus?policyId=${policyId}`);
      const smokingStatus = response.data?.smokingStatus || response.data?.smoking || '';
      
      // Convert to Y/N format
      const tobaccoValue = smokingStatus ? (smokingStatus.toLowerCase().includes('yes') || smokingStatus.toLowerCase().includes('smoker') ? 'Y' : 'N') : '';
      
      setFormData(prev => ({
        ...prev,
        application: {
          ...prev.application,
          tobacco: tobaccoValue
        }
      }));
    } catch (error) {
      console.error('Error fetching smoking status:', error);
      // Silently handle error
    }
  };
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (policyData) {
          setFormData(prev => ({
            ...prev,
            application: {
              clientName: policyData.clientName || '',
              clientNo: policyData.clientNo || '',
              quotationNumber: policyData.quotationNumber || '',
              quotationDate: policyData.quotationDate || '',
              applicationNumber: policyData.applicationNumber || '',
              productName: 'TERM LIFE INSURANCE',
              sumAssured: policyData.sumAssured || '',
              annualPremium: policyData.annualPremium || '',
              issueDate: policyData.issueDate || '',
              tobacco: policyData.tobacco || '',
              issueAge: policyData.issueAge || '',
              uwClass: policyData.uwClass || ''
            }
          }));
          
          // Fetch smoking status if policyId is available
          if (policyData.policyId || policyData.applicationNumber) {
            await fetchSmokingStatus(policyData.policyId || policyData.applicationNumber);
          }
        } else if (txnTypeId) {
          const response = await axios.get('http://localhost:8001/eapp/getAllUw');
          const allUwPolicies = response.data;
          const matchingPolicy = allUwPolicies.find((policy: any) => policy.policyId === txnTypeId);
         
          if (matchingPolicy) {
            const mappedData = mapBackendToState(matchingPolicy);
            setFormData(mappedData);
            
            // Fetch coverage data and smoking status
            await Promise.all([
              fetchCoverageData(txnTypeId),
              fetchSmokingStatus(txnTypeId)
            ]);
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [policyData, txnTypeId]);
 
  const handleInputChange = (section: keyof FormData, field: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
     
      return updated;
    });
  };
 
  const handleSave = async () => {
    try {
      // Find the existing UwPolicy record first
      const response = await axios.get('http://localhost:8001/eapp/getAllUw');
      const allUwPolicies = response.data;
      const existingPolicy = allUwPolicies.find((policy: any) => policy.policyId === txnTypeId);
     
      if (!existingPolicy) {
        alert('Policy not found for update');
        return;
      }
     
      // Update only the changed fields, keep existing values for others
      const payload = {
        uwid: existingPolicy.uwid,
        policyId: existingPolicy.policyId,
        underwriterId: existingPolicy.underwriterId,
        uwDetailId: existingPolicy.uwDetailId,
        assignRole: existingPolicy.assignRole,
        sa: parseFloat(formData.application.sumAssured) || existingPolicy.sa,
        periodPrem: parseFloat(formData.application.annualPremium) || existingPolicy.periodPrem,
        normalPrem: parseFloat(formData.application.annualPremium) || existingPolicy.normalPrem,
        stateId: existingPolicy.stateId,
        product: formData.application.productName || existingPolicy.product
      };
     
     
      // Use existing /eapp/update endpoint
      const updateResponse = await axios.post('http://localhost:8001/eapp/update', payload);
     
      alert('Data saved successfully!');
    } catch (error: any) {
      alert('Error saving data: ' + (error.response?.data?.message || error.message));
    }
  };
 
  if (loading) {
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
 
  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: "auto", backgroundColor: "#f4f6f8" }}>
 
      {/* ================= HEADER ================= */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/underwriting")}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Underwriting Details
          </Typography>
          <Typography variant="body2">
            Application : {txnTypeId}
          </Typography>
        </Box>
      </Stack>
 
      {/* ================= Application Basic Info ================= */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Application Basic Info
        </Typography>
 
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Client Name"
              fullWidth
              value={formData.application.clientName}
              onChange={(e) => handleInputChange('application', 'clientName', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Client No."
              fullWidth
              value={formData.application.clientNo}
              onChange={(e) => handleInputChange('application', 'clientNo', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Quotation Number" fullWidth value={formData.application.quotationNumber} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Quotation Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={formData.application.quotationDate} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Application Number" fullWidth value={formData.application.applicationNumber} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Product Name" fullWidth value={formData.application.productName} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Sum Assured"
              fullWidth
              value={formData.application.sumAssured}
              onChange={(e) => handleInputChange('application', 'sumAssured', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Annual Premium" fullWidth value={formData.application.annualPremium} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Issue Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.application.issueDate}
              onChange={(e) => handleInputChange('application', 'issueDate', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Tobacco (Y/N)"
              fullWidth
              value={formData.application.tobacco}
              onChange={(e) => handleInputChange('application', 'tobacco', e.target.value)}
              disabled={!editable}
              placeholder="Y/N"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Issue Age"
              fullWidth
              value={formData.application.issueAge}
              onChange={(e) => handleInputChange('application', 'issueAge', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!editable}>
              <InputLabel>UW Class</InputLabel>
              <Select
                value={formData.application.uwClass}
                label="UW Class"
                onChange={(e) => handleInputChange('application', 'uwClass', e.target.value)}
              >
                {uwClassOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
 
      {/* ================= RIDERS SECTION HEADER ================= */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, mt: 4 }}>
        Riders
      </Typography>
 
      {/* ================= Rider Type – Accidental Death Benefit ================= */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Accidental Death Benefit
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Coverage Amount"
              fullWidth
              value={formData.adbRider.coverageAmount}
              onChange={(e) => handleInputChange('adbRider', 'coverageAmount', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.adbRider.startDate}
              onChange={(e) => handleInputChange('adbRider', 'startDate', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.adbRider.endDate}
              onChange={(e) => handleInputChange('adbRider', 'endDate', e.target.value)}
              disabled={!editable}
            />
          </Grid>
        </Grid>
      </Paper>
 
      {/* ================= Rider Type – Waiver of Premium ================= */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Waiver of Premium
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Coverage Amount"
              fullWidth
              value={formData.waiverRider.coverageAmount}
              onChange={(e) => handleInputChange('waiverRider', 'coverageAmount', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.waiverRider.startDate}
              onChange={(e) => handleInputChange('waiverRider', 'startDate', e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.waiverRider.endDate}
              onChange={(e) => handleInputChange('waiverRider', 'endDate', e.target.value)}
              disabled={!editable}
            />
          </Grid>
        </Grid>
      </Paper>
 
      {/* ================= ACTION BUTTONS ================= */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate("/underwriting")}>
            Back
          </Button>
          <Button variant="contained" disabled={!editable} onClick={handleSave}>
            Save
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(`/underwriting/${txnTypeId}/details`)}
          >
            Next
          </Button>
        </Stack>
      </Paper>
 
    </Box>
  );
};
 
export default ApplicationBasicInfo;

