require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const studentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [30, "Roll number must be 30 characters or fewer"]
    },
    fullName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [80, "Department must be 80 characters or fewer"]
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be between 1 and 12"],
      max: [12, "Semester must be between 1 and 12"]
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [25, "Phone number must be 25 characters or fewer"],
      default: ""
    }
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

function handleError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({ message: "That roll number is already in use." });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    const message = error.name === "ValidationError"
      ? Object.values(error.errors).map((item) => item.message).join(". ")
      : "Invalid student record.";
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
}

app.get("/api/students", async (req, res) => {
  try {
    const filter = {};
    const rollNumber = typeof req.query.rollNumber === "string" ? req.query.rollNumber.trim() : "";
    const department = typeof req.query.department === "string" ? req.query.department.trim() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    if (rollNumber) {
      filter.rollNumber = new RegExp(`^${rollNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    } else if (department) {
      filter.department = new RegExp(department.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    } else if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { rollNumber: new RegExp(`^${escapedSearch}`, "i") },
        { department: new RegExp(escapedSearch, "i") }
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(students);
  } catch (error) {
    return handleError(res, error);
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    return res.status(201).json(student);
  } catch (error) {
    return handleError(res, error);
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      overwrite: false
    });

    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }
    return res.json(student);
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }
    return res.status(204).end();
  } catch (error) {
    return handleError(res, error);
  }
});

app.use("/api", (req, res) => res.status(404).json({ message: "API endpoint not found." }));
app.use(express.static(path.join(__dirname, "public")));

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required. Copy .env.example to .env and configure MongoDB Atlas.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`Student Records is available at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(`Unable to start Student Records: ${error.message}`);
  process.exitCode = 1;
});
