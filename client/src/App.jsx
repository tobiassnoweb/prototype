import { useState } from "react";
import "./App.css";

import { Routes, Route } from "react-router-dom";
import { SymptomsList } from "./components/symptoms-list";
import { SymptomsDetail } from "./components/symptoms-detail";
import ChatInterface from "./components/chat-interface";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Symptom & Intervention Assistant
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Symptoms
          </Button>
          <Button color="inherit" onClick={() => navigate("/chat")}>
            AI Chat
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<SymptomsList />} />
          <Route path="/symptoms" element={<SymptomsList />} />
          <Route path="/symptoms/:id" element={<SymptomsDetail />} />
          <Route
            path="/chat"
            element={
              <Box>
                <ChatInterface
                  onInterventionSelected={(intervention) => {
                    console.log("Selected intervention:", intervention);
                    // Navigate to intervention detail or show more info
                  }}
                />
              </Box>
            }
          />
        </Routes>
      </Container>
    </>
  );
}

export default App;
