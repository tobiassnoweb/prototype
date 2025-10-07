import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Snackbar,
  TextField,
  Radio,
  FormLabel,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

import {
  Intervention,
  SymptomWithInterventions,
  Severity,
} from "../types/types";
//import { useSymptomsContext } from "../context/symptoms";
import { symptomsService } from "../services/symptoms-service";
import { interventionService } from "../services/intervention-service";

export const SymptomsDetail: React.FC = () => {
  const { id } = useParams();
  //const { loading, error, symptoms, setSymptoms } = useSymptomsContext();
  const [symptom, setSymptom] = useState<SymptomWithInterventions | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingInterventions, setLoadingInterventions] =
    useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [severity, setSeverity] = useState<Severity>(null);

  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<SymptomWithInterventions>>({});
  const [currentInterventions, setCurrentInterventions] = useState<
    Intervention[]
  >([]);

  useEffect(() => {
    const fetchSymptom = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const res = await symptomsService.get(id);
        setSymptom(res.data!.message as SymptomWithInterventions);
        setError(null);
      } catch (err) {
        setError("Failed to load symptoms. Please try again later.");
        console.error("Error fetching symptoms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSymptom();
  }, [id]);

  useEffect(() => {
    //fetch master list, should live in shared context or application cache
    const fetchInterventions = async () => {
      try {
        if (!id) return;
        if (!loading) {
          setLoadingInterventions(true);
          const res = await interventionService.getAll();
          const interventions = res.data!.message;
          setInterventions(interventions as Intervention[]);

          let currentInterventions = symptom!.interventions.flatMap(
            (interventionId: number) =>
              interventions.filter(
                (_intervent: Intervention) => _intervent.id == interventionId
              )
          );

          setCurrentInterventions(currentInterventions);
        }
        setError(null);
      } catch (err) {
        setError("Failed to load symptoms. Please try again later.");
        console.error("Error fetching symptoms:", err);
      } finally {
        setLoadingInterventions(false);
      }
    };
    fetchInterventions();
  }, [id, loading]);

  const filteredInterventions = useMemo(() => {
    if (!severity || !currentInterventions.length) return [];
    return currentInterventions.filter((intervention: Intervention) =>
      intervention.severity.includes(severity)
    );
  }, [currentInterventions, severity]);

  const handleBack = () => {
    setForm({});
    setIsEditing(false);
    navigate("/");
  };

  const handleEdit = () => {
    setForm(symptom || {});
    setIsEditing(true);
  };
  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await symptomsService.remove(id!);

      // Show toast
      setToastMessage(
        `Symptom "${symptom?.name}" has been successfully deleted`
      );
      setToastOpen(true);

      // Navigate back to symptoms list after a short delay
      setTimeout(() => {
        navigate("/symptoms");
      }, 2000);
    } catch (error) {
      console.error("Error deleting symptom:", error);
      setToastMessage("Failed to delete symptom. Please try again.");
      setToastOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async () => {
    const response = await symptomsService.update(id!, form);
    navigate(`/symptoms/${id}`);
    // Show success toast
    setToastMessage(`Symptom "${symptom?.name}" has been successfully updated`);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
          <Box mt={2}>
            <Button variant="outlined" onClick={handleBack}>
              Back to Symptoms
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }
  if (isEditing && symptom) {
    return (
      <Container maxWidth="md">
        <Box py={3}>
          {/* Header with back button and edit button */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ minWidth: "auto" }}
            >
              Cancel
            </Button>
            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={handleSave} color="primary">
                Save
              </Button>
            </Box>
          </Box>
        </Box>
        <Card elevation={2}>
          <CardContent>
            <Box mb={3}>
              <TextField
                id="name"
                label="Name"
                variant="outlined"
                fullWidth
                value={form.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
              />
            </Box>
            <Box mb={3}>
              <TextField
                id="description"
                label="Description"
                variant="outlined"
                multiline
                rows={4}
                fullWidth
                value={form.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
              />
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!error && !isEditing && symptom) {
    return (
      <Container maxWidth="md">
        <Box py={3}>
          {/* Header with back button and edit button */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ minWidth: "auto" }}
            >
              Back
            </Button>
            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={handleEdit} color="primary">
                Edit
              </Button>
              <Button
                variant="contained"
                onClick={handleDelete}
                color="error"
                disabled={deleteLoading}
              >
                {deleteLoading ? <CircularProgress size={20} /> : "Delete"}
              </Button>
            </Box>
          </Box>
        </Box>

        <Card elevation={2}>
          <CardContent>
            <Box mb={3}>
              <Typography variant="h4" component="h1" gutterBottom>
                {symptom.name}
              </Typography>
            </Box>
            <Box mb={3}>
              <Typography variant="body1" color="text.secondary" paragraph>
                {symptom.description}
              </Typography>
              <Box>
                <FormLabel>Define the severity of your symptoms</FormLabel>
                <RadioGroup
                  name="radio-buttons-group"
                  value={severity ?? ""}
                  onChange={(_, value) => setSeverity(value as Severity)}
                >
                  <FormControlLabel
                    value="mild"
                    control={<Radio />}
                    label="Mild"
                  />
                  <FormControlLabel
                    value="moderate"
                    control={<Radio />}
                    label="Moderate"
                  />
                  <FormControlLabel
                    value="severe"
                    control={<Radio />}
                    label="Severe"
                  />
                </RadioGroup>
              </Box>
            </Box>
            {!loadingInterventions && filteredInterventions!.length > 0 ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Available Treatments
                  </Typography>
                  <List disablePadding>
                    {filteredInterventions.map((intervention: Intervention) => (
                      <React.Fragment key={intervention.id}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar src={intervention.product_image} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="medium"
                                >
                                  {intervention.name}

                                  {intervention.SOS && (
                                    <Chip
                                      color="warning"
                                      label="SOS"
                                      style={{ marginLeft: "1rem" }}
                                    ></Chip>
                                  )}
                                </Typography>
                              </>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {intervention.description}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              </>
            ) : (
              loadingInterventions && <CircularProgress />
            )}
          </CardContent>
        </Card>

        {/* Toast Notification */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={4000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseToast}
            severity="success"
            sx={{ width: "100%" }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Container>
    );
  }
};
