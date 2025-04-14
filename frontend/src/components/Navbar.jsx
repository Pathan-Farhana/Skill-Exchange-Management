// import React from "react";
// import { Navbar, Nav, Container, Form, FormControl, Button } from "react-bootstrap";
// import { Link } from "react-router-dom";
// import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";


// const SkillExchangeNavbar = () => {
//   return (
//     <Navbar bg="light" expand="lg" className="w-100 fixed-top shadow">
//       <Container fluid>
//         <Navbar.Brand as={Link} to="/" className="fw-bold">SkillExchange</Navbar.Brand>
//         <Navbar.Toggle aria-controls="navbarScroll" />

//         <Navbar.Collapse id="navbarScroll">
//           <div className="d-flex w-100 justify-content-between align-items-center">
//             <Form className="d-flex flex-grow-1 mx-3">
//               <FormControl type="search" placeholder="Search" className="me-2 w-100" />
//               <Button variant="outline-primary">Search</Button>
//             </Form>

//             <Nav>
//               <Nav.Link as={Link} to="/schedule">📅 Schedule</Nav.Link>
//               <Nav.Link as={Link} to="/messages">💬 Messages</Nav.Link>
//               <Nav.Link as={Link} to="/profile">👤 Profile</Nav.Link>
              
//               <SignedOut>
//                 <SignInButton />
//               </SignedOut>
//               <SignedIn>
//                 <UserButton />
//               </SignedIn>
//             </Nav>
//           </div>
//         </Navbar.Collapse>
//       </Container>
//     </Navbar>
//   );
// };

// export default SkillExchangeNavbar;



import React, { useState } from "react";
import { Navbar, Nav, Container, Form, FormControl, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

const SkillExchangeNavbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?skill=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="w-100 fixed-top shadow">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold">SkillExchange</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <div className="d-flex w-100 justify-content-between align-items-center">
            <Form className="d-flex flex-grow-1 mx-3" onSubmit={handleSearch}>
              <FormControl
                type="search"
                placeholder="Search by skill"
                className="me-2 w-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-primary" type="submit">Search</Button>
            </Form>
            <Nav>
              <Nav.Link as={Link} to="/schedule">📅 Schedule</Nav.Link>
              <Nav.Link as={Link} to="/messages">💬 Messages</Nav.Link>
              <Nav.Link as={Link} to="/profile">👤 Profile</Nav.Link>
              <SignedOut><SignInButton /></SignedOut>
              <SignedIn><UserButton /></SignedIn>
            </Nav>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default SkillExchangeNavbar;

