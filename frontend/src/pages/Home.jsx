// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./Home.css";

// const fullStar = "https://cdn-icons-png.flaticon.com/512/616/616489.png";
// const emptyStar = "https://upload.wikimedia.org/wikipedia/commons/4/49/Star_empty.svg";

// function Home() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showFeedbackModal, setShowFeedbackModal] = useState(false);
//   const [feedbackRating, setFeedbackRating] = useState(0);

//   const boyIcon = "https://cdn-icons-png.flaticon.com/512/236/236831.png";
//   const girlIcon = "https://cdn-icons-png.flaticon.com/512/847/847971.png";

//   useEffect(() => {
//     axios
//       .get("http://localhost:8000/api/users")
//       .then((res) => setUsers(res.data))
//       .catch((err) => console.error("Error fetching users:", err));
//   }, []);

//   const renderStars = (rating) => {
//     const stars = [];
//     for (let i = 1; i <= 5; i++) {
//       stars.push(
//         <img
//           key={i}
//           src={i <= rating ? fullStar : emptyStar}
//           alt="star"
//           style={{ width: "20px", height: "20px" }}
//         />
//       );
//     }
//     return <div className="d-flex justify-content-center">{stars}</div>;
//   };

//   const handleFeedbackSubmit = async () => {
//     if (feedbackRating < 1 || feedbackRating > 5) {
//       alert("Please provide a rating between 1 and 5.");
//       return;
//     }

//     try {
//       await axios.post("http://localhost:8000/api/feedback", {
//         clerkId: selectedUser.clerkId,
//         newRating: feedbackRating,
//       });

//       alert("Thanks for the feedback!");
//       setShowFeedbackModal(false);
//       setFeedbackRating(0);
//       setSelectedUser(null);

//       const updated = await axios.get("http://localhost:8000/api/users");
//       setUsers(updated.data);
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong!");
//     }
//   };

//   const handleMessage = () => {
//     alert(`Message sent to ${selectedUser.fullName}!`);
//   };

//   return (
//     <div className="container mt-5">
//       <center><h2 className="mb-4">Skill Exchange Users</h2></center>

//       <div className="row">
//         {users.map((user) => (
//           <div className="col-md-4 mb-4" key={user.clerkId}>
//             <div
//               className="card h-100 shadow-sm text-center"
//               style={{ cursor: "pointer" }}
//               onClick={() => {
//                 setSelectedUser(user);
//                 setShowFeedbackModal(false);
//               }}
//             >
//               <img
//                 src={user.gender === "female" ? girlIcon : boyIcon}
//                 className="card-img-top mx-auto mt-4"
//                 alt="User"
//                 style={{ width: "80px", height: "80px", borderRadius: "50%" }}
//               />
//               <div className="card-body">
//                 <h5 className="card-title">{user.fullName}</h5>
//                 <p>Age: {user.age}</p>
//                 <p>Skills: {user.skills.join(", ")}</p>
//                 <p>Wants to Learn: {user.learnSkills.join(", ")}</p>
//                 {renderStars(user.rating)}
//               </div>
//             </div>
//           </div>
//         ))}
//          {users.map((user) => (
//           <div className="col-md-4 mb-4" key={user.clerkId}>
//             <div
//               className="card h-100 shadow-sm text-center"
//               style={{ cursor: "pointer" }}
//               onClick={() => {
//                 setSelectedUser(user);
//                 setShowFeedbackModal(false);
//               }}
//             >
//               <img
//                 src={user.gender === "female" ? girlIcon : boyIcon}
//                 className="card-img-top mx-auto mt-4"
//                 alt="User"
//                 style={{ width: "80px", height: "80px", borderRadius: "50%" }}
//               />
//               <div className="card-body">
//                 <h5 className="card-title">{user.fullName}</h5>
//                 <p>Age: {user.age}</p>
//                 <p>Skills: {user.skills.join(", ")}</p>
//                 <p>Wants to Learn: {user.learnSkills.join(", ")}</p>
//                 {renderStars(user.rating)}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* User Details Modal */}
//       {selectedUser && !showFeedbackModal && (
//         <div className="modal-overlay">
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <button className="close-btn" onClick={() => setSelectedUser(null)}>✖</button>
//             <img
//               src={selectedUser.gender === "female" ? girlIcon : boyIcon}
//               alt="User"
//               className="modal-avatar"
//               style={{ width: "80px", height: "80px", borderRadius: "50%", marginBottom: "10px" }}
//             />
//             <h4>{selectedUser.fullName}</h4>
//             <p>Age: {selectedUser.age}</p>
//             <p>Skills: {selectedUser.skills.join(", ")}</p>
//             <p>Wants to Learn: {selectedUser.learnSkills.join(", ")}</p>
//             {renderStars(selectedUser.rating)}

//             <button className="btn btn-success mt-3" onClick={() => setShowFeedbackModal(true)}>
//               Give Feedback
//             </button>
//             <button className="btn btn-primary mt-2 ms-2" onClick={handleMessage}>
//               Message
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Feedback Input Modal */}
//       {selectedUser && showFeedbackModal && (
//         <div className="modal-overlay">
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <button className="close-btn" onClick={() => setShowFeedbackModal(false)}>✖</button>
//             <h5>Leave feedback for {selectedUser.fullName}</h5>
//             <label htmlFor="ratingInput" className="form-label mt-3">
//               Enter a rating (1 to 5):
//             </label>
//             <input
//               type="number"
//               className="form-control"
//               min="1"
//               max="5"
//               value={feedbackRating}
//               onChange={(e) => setFeedbackRating(Number(e.target.value))}
//               placeholder="e.g., 4"
//             />
//             <button className="btn btn-success mt-3" onClick={handleFeedbackSubmit}>
//               Submit Feedback
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Home;



import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Home.css";

const fullStar = "https://cdn-icons-png.flaticon.com/512/616/616489.png";
const emptyStar = "https://upload.wikimedia.org/wikipedia/commons/4/49/Star_empty.svg";

function Home() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);

  const boyIcon = "https://cdn-icons-png.flaticon.com/512/236/236831.png";
  const girlIcon = "https://cdn-icons-png.flaticon.com/512/847/847971.png";

  const location = useLocation();

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const searchSkill = searchParams.get("skill")?.toLowerCase() || "";

  const filteredUsers = users
    .filter((user) =>
      searchSkill
        ? user.skills.some((skill) => skill.toLowerCase().includes(searchSkill))
        : true
    )
    .sort((a, b) => b.rating - a.rating); // 👈 Sort by rating descending

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img
          key={i}
          src={i <= rating ? fullStar : emptyStar}
          alt="star"
          style={{ width: "20px", height: "20px" }}
        />
      );
    }
    return <div className="d-flex justify-content-center">{stars}</div>;
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackRating < 1 || feedbackRating > 5) {
      alert("Please provide a rating between 1 and 5.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/feedback", {
        clerkId: selectedUser.clerkId,
        newRating: feedbackRating,
      });

      alert("Thanks for the feedback!");
      setShowFeedbackModal(false);
      setFeedbackRating(0);
      setSelectedUser(null);

      const updated = await axios.get("http://localhost:8000/api/users");
      setUsers(updated.data);
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  const handleMessage = () => {
    alert(`Message sent to ${selectedUser.fullName}!`);
  };

  return (
    <div className="container mt-5 pt-5">
      <center><h2 className="mb-4">Skill Exchange Users</h2></center>

      <div className="row">
        {filteredUsers.map((user) => (
          <div className="col-md-4 mb-4" key={user.clerkId}>
            <div
              className="card h-100 shadow-sm text-center"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedUser(user);
                setShowFeedbackModal(false);
              }}
            >
              <img
                src={user.gender === "female" ? girlIcon : boyIcon}
                className="card-img-top mx-auto mt-4"
                alt="User"
                style={{ width: "80px", height: "80px", borderRadius: "50%" }}
              />
              <div className="card-body">
                <h5 className="card-title">{user.fullName}</h5>
                <p>Age: {user.age}</p>
                <p>Skills: {user.skills.join(", ")}</p>
                <p>Wants to Learn: {user.learnSkills.join(", ")}</p>
                {renderStars(user.rating)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Details Modal */}
      {selectedUser && !showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>✖</button>
            <img
              src={selectedUser.gender === "female" ? girlIcon : boyIcon}
              alt="User"
              className="modal-avatar"
              style={{ width: "80px", height: "80px", borderRadius: "50%", marginBottom: "10px" }}
            />
            <h4>{selectedUser.fullName}</h4>
            <p>Age: {selectedUser.age}</p>
            <p>Skills: {selectedUser.skills.join(", ")}</p>
            <p>Wants to Learn: {selectedUser.learnSkills.join(", ")}</p>
            {renderStars(selectedUser.rating)}

            <button className="btn btn-success mt-3" onClick={() => setShowFeedbackModal(true)}>
              Give Feedback
            </button>
            <button className="btn btn-primary mt-2 ms-2" onClick={handleMessage}>
              Message
            </button>
          </div>
        </div>
      )}

      {/* Feedback Input Modal */}
      {selectedUser && showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowFeedbackModal(false)}>✖</button>
            <h5>Leave feedback for {selectedUser.fullName}</h5>
            <label htmlFor="ratingInput" className="form-label mt-3">
              Enter a rating (1 to 5):
            </label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="5"
              value={feedbackRating}
              onChange={(e) => setFeedbackRating(Number(e.target.value))}
              placeholder="e.g., 4"
            />
            <button className="btn btn-success mt-3" onClick={handleFeedbackSubmit}>
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
