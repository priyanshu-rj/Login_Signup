require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use(
  cors({
    origin: "https://deploye-mern-1whq.vercel.app",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);





mongoose.connect("mongodb+srv://test:CHPq8kUbi8ioqqyQ@cluster0.og3gcxd.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

  const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true },
    profilePicture: { type: String, default: "" }
});



const User = mongoose.model("User", UserSchema);

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

app.post("/signup", async (req, res) => {
    const { fullName, phoneNumber, email, password, companyName } = req.body;

    try {
       
        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            return res.status(400).json({ message: "Email or Phone number already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, phoneNumber, email, password: hashedPassword, companyName });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server error" });
    }
});



app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret_key", { expiresIn: "1h" });
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/upload-profile", upload.single("profilePicture"), async (req, res) => {
    try {
        const { userId } = req.body;
        const profilePicture = req.file ? `/uploads/${req.file.filename}` : "";
        
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture }, { new: true });
        res.json({ message: "Profile picture updated", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile picture" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
