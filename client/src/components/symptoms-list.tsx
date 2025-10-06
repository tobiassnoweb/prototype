import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Container,
  Divider,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { symptomsService } from "../services/symptoms-service";
import { SymptomWithInterventions } from "../types/types";

export const SymptomsList: React.FC = () => {
  const [symptoms, setSymptoms] = useState<SymptomWithInterventions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        setLoading(true);
        const response = await symptomsService.getAll();
        setSymptoms(response.data!.message);
      } catch (err) {
        setError("Failed to load symptoms. Please try again later.");
        console.error("Error fetching symptoms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  const handleSymptomClick = (symptomId: number) => {
    navigate(`/symptoms/${symptomId}`);
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
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={3}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Symptoms Directory
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          mb={3}
        >
          Select a symptom to learn more about treatment options
        </Typography>

        <Card elevation={2}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {symptoms.map((symptom, index) => (
                <React.Fragment key={symptom.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSymptomClick(symptom.id)}
                      sx={{
                        py: 2,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6" component="span">
                              {symptom.name}
                            </Typography>
                            <Chip
                              label={`${
                                symptom.interventions.length
                              } treatment${
                                symptom.interventions.length !== 1 ? "s" : ""
                              }`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {symptom.description}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < symptoms.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {symptoms.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No symptoms found.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};
