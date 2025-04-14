import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Badge, Card } from "react-bootstrap";
import "./Form.css";
import 'bootstrap/dist/css/bootstrap.min.css';

import { useNavigate } from "react-router-dom";
const ProfileForm = () => {
  const { user } = useUser('nsadfa');

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("female");

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);

  const [learnInput, setLearnInput] = useState("");
  const [learnSkills, setLearnSkills] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      setName(user.publicMetadata?.fullName || "");
      setAge(user.publicMetadata?.age || "");
      setGender(user.publicMetadata?.gender || "female");
      setSkills(user.publicMetadata?.skills || []);
      setLearnSkills(user.publicMetadata?.learnSkills || []);
    }
  }, [user]);

  const handleAddSkill = () => {
    if (skillInput && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddLearnSkill = () => {
    if (learnInput && !learnSkills.includes(learnInput)) {
      setLearnSkills([...learnSkills, learnInput]);
      setLearnInput("");
    }
  };

  const handleRemoveLearnSkill = (skill) => {
    setLearnSkills(learnSkills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("User not found!");
      return;
    }

    const userData = {
      clerkId: user.id,
      fullName: name,
      age,
      gender,
      skills,
      learnSkills,
    };

    // try {
      const response = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Server error");

      alert("✅ Profile saved to MongoDB!");
      navigate("/")
    // } catch (err) {
    //   console.error("Error saving profile:", err);
    //   alert("❌ Failed to save profile.");
    // }
  };

  return (
    <div className="ContainerOuter">
      <Container className="mt-4 profile-container">
        <Card className="shadow p-4">
          <Card.Body>
            <h2 className="text-center mb-4">Update Your Profile</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formName" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>

              {/* <Row>
                <Col md={6}>
                  <Form.Group controlId="formAge" className="mb-3">
                    <Form.Label>Age</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formGender" className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row> */}

<Row className="mb-3">
  <Col xs={12} sm={6}>
    <Form.Group controlId="formAge">
      <Form.Label>Age</Form.Label>
      <Form.Control
        type="number"
        placeholder="Your age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />
    </Form.Group>
  </Col>
  <Col xs={12} sm={6}>
    <Form.Group controlId="formGender">
      <Form.Label>Gender</Form.Label>
      <Form.Select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="female">Female</option>
        <option value="male">Male</option>
        <option value="other">Other</option>
      </Form.Select>
    </Form.Group>
  </Col>
</Row>


              <Form.Group className="mb-3">
                <Form.Label>Skills You Have</Form.Label>
                <div className="input-group-custom mb-2 d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleAddSkill}>+ Add</Button>
                </div>
                <div>
                  {skills.map((skill, index) => (
                    <Badge key={index} bg="secondary" pill className="me-2 mb-2">
                      {skill} <button type="button" onClick={() => handleRemoveSkill(skill)} className="btn-close btn-close-white btn-sm ms-1"></button>
                    </Badge>
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Skills You Want to Learn</Form.Label>
                <div className="input-group-custom mb-2 d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter a skill to learn"
                    value={learnInput}
                    onChange={(e) => setLearnInput(e.target.value)}
                  />
                  <Button variant="success" onClick={handleAddLearnSkill}>+ Add</Button>
                </div>
                <div>
                  {learnSkills.map((skill, index) => (
                    <Badge key={index} bg="info" pill className="me-2 mb-2">
                      {skill} <button type="button" onClick={() => handleRemoveLearnSkill(skill)} className="btn-close btn-close-white btn-sm ms-1"></button>
                    </Badge>
                  ))}
                </div>
              </Form.Group>

              <div className="text-center">
                <Button variant="dark" type="submit">Save Profile</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ProfileForm;
