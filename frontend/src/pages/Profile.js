import React from "react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
    const { user, logout } = useAuth();

    if (!user) return <h2>Please log in</h2>;

    return (
        <div>
            <h2>Welcome, {user.fullName}</h2>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

export default Profile;
