import { useState } from "react";
import { Container, Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import "./Form.css"; // Reuse the same styling
import 'bootstrap/dist/css/bootstrap.min.css';

const SessionForm = () => {
  const [yourName, setYourName] = useState("");
  const [userName, setUserName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const handleSchedule = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!yourName || !userName || !date || !time) {
      alert("Please fill all fields.");
      return;
    }

    // Combine date + time into a full timestamp (optional for real backend use)
    const fullTime = new Date(`${date}T${time}`);

    // Simulate meeting link generation
    const link = `https://meet.jit.si/session-${Math.random().toString(36).substring(2, 8)}`;
    setMeetingLink(link);

    // Optional: send to backend
    // await fetch("http://localhost:8000/api/sessions", { ... })
  };

  return (
    <div className="ContainerOuter">
      <Container className="mt-4 profile-container">
        <Card className="shadow p-4">
          <Card.Body>
            <h2 className="text-center mb-4">Schedule a Session</h2>
            <Form onSubmit={handleSchedule}>
              <Row className="mb-3">
                <Col xs={12} sm={6}>
                  <Form.Group controlId="formYourName">
                    <Form.Label>Your Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your name"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Group controlId="formUserName">
                    <Form.Label>User Name (Other Person)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter their name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col xs={6}>
                  <Form.Group controlId="formDate">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group controlId="formTime">
                    <Form.Label>Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="text-center">
                <Button variant="primary" type="submit">
                  Schedule
                </Button>
              </div>
            </Form>

            {meetingLink && (
              <Alert variant="success" className="mt-4 text-center">
                ✅ Meeting Scheduled: <br />
                <a href={meetingLink} target="_blank" rel="noreferrer">{meetingLink}</a>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default SessionForm;
