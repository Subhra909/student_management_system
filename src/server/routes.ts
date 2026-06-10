import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, Attendance, Mark, Fee, Message, AuditLog, Tenant, Notification, Timetable, Assignment, AssignmentSubmission, AdmitCard } from "./db.js";
import { v4 as uuidv4 } from "uuid";

export const apiRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

// Helper for initial setup
apiRouter.post("/system/init-superadmin", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ role: "superadmin" });
    if (existing) return res.status(400).json({ error: "Super Admin already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const superadmin = new User({
      uid: uuidv4(),
      tenantId: "SYSTEM",
      email,
      password: hashedPassword,
      name: name || "System Admin",
      role: "superadmin",
      collegeName: "EduNexus Global",
      currentSessionId: uuidv4()
    });
    await superadmin.save();
    res.json({ message: "Super Admin created" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to check if DB is connected
const checkDbConnection = (req: any, res: any, next: any) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database connection is offline. Please configure your MongoDB Atlas URI in the .env file." });
  }
  next();
};

apiRouter.use(checkDbConnection);

// Middleware to protect routes
export const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ uid: decoded.uid });
    
    if (!user) return res.status(401).json({ error: "User not found" });
    if (decoded.sessionId && user.currentSessionId !== decoded.sessionId) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin" && req.user?.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
  next();
};

const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
  next();
};

// Auth Routes
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, phoneNumber, department, rollNo, section, semester, collegeSlug } = req.body;
    
    // Find the tenant by slug
    const tenant = await Tenant.findOne({ slug: collegeSlug });
    if (!tenant) return res.status(404).json({ error: "College node not found. Please contact your administrator." });

    const role = "student"; 
    const existing = await User.findOne({ email, tenantId: tenant.tenantId });
    if (existing) return res.status(400).json({ error: "Email already in use for this college" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const uid = uuidv4();
    const enrollmentId = `ENR-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = new User({
      uid,
      tenantId: tenant.tenantId,
      email,
      password: hashedPassword,
      name,
      role,
      phoneNumber: phoneNumber || "",
      department: department || "",
      rollNo: rollNo || "",
      section: section || "",
      semester: semester || "",
      collegeName: tenant.name,
      enrollmentId,
      currentSessionId: uuidv4(),
      lastLoginAt: new Date().toISOString()
    });

    await user.save();
    
    const token = jwt.sign({ uid: user.uid, sessionId: user.currentSessionId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { uid, email, name, role, enrollmentId, phoneNumber, department, rollNo, section, semester, collegeName: tenant.name, tenantId: tenant.tenantId } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    user.currentSessionId = uuidv4();
    user.lastLoginAt = new Date().toISOString();
    user.lastLoginIp = req.ip || "0.0.0.0";
    await user.save();

    const token = jwt.sign({ uid: user.uid, sessionId: user.currentSessionId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { 
      uid: user.uid, 
      tenantId: user.tenantId,
      email: user.email, 
      name: user.name, 
      role: user.role, 
      enrollmentId: user.enrollmentId,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      department: user.department,
      rollNo: user.rollNo,
      section: user.section,
      semester: user.semester,
      collegeName: user.collegeName
    } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/auth/me", requireAuth, (req: any, res) => {
  const { uid, tenantId, email, name, role, enrollmentId, currentSessionId, phoneNumber, profilePicture, department, rollNo, section, semester, collegeName } = req.user;
  res.json({ user: { uid, tenantId, email, name, role, enrollmentId, currentSessionId, phoneNumber, profilePicture, department, rollNo, section, semester, collegeName } });
});

apiRouter.get("/tenant/:slug/departments", async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json({ departments: tenant.departments || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/tenant/departments", requireAuth, async (req: any, res) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.user.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json({ departments: tenant.departments || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/auth/profile", requireAuth, async (req: any, res) => {
  try {
    const { name, phoneNumber, profilePicture, department, rollNo, section, semester, collegeName } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Student identity lock: Once set, only admins can change these
    if (user.role === "student") {
      if (!user.department && department) user.department = department;
      if (!user.rollNo && rollNo) user.rollNo = rollNo;
      if (!user.semester && semester) user.semester = semester;
      if (!user.section && section) user.section = section;
      if (!user.collegeName && collegeName) user.collegeName = collegeName;
    } else {
      // Admins and Superadmins can change everything
      if (department !== undefined) user.department = department;
      if (rollNo !== undefined) user.rollNo = rollNo;
      if (semester !== undefined) user.semester = semester;
      if (collegeName !== undefined) user.collegeName = collegeName;
    }

    await user.save();
    res.json({ 
      message: "Profile updated",
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        enrollmentId: user.enrollmentId,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        department: user.department,
        rollNo: user.rollNo,
        section: user.section,
        semester: user.semester,
        collegeName: user.collegeName,
        tenantId: user.tenantId
      }
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Student Routes Placeholder removed (duplicate)

apiRouter.post("/student/attendance", requireAuth, async (req: any, res) => {
  return res.status(403).json({ error: "Attendance can only be registered and uploaded by the college portal." });
});

apiRouter.post("/student/messages", requireAuth, async (req: any, res) => {
  try {
    const { content, timestamp } = req.body;
    const msg = new Message({
      tenantId: req.user.tenantId,
      senderId: req.user.uid,
      receiverId: "admin",
      senderName: req.user.name,
      content,
      timestamp: timestamp || new Date().toISOString()
    });
    await msg.save();
    res.json(msg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/student/fee/pay", requireAuth, async (req: any, res) => {
  try {
    const { feeId, transactionId, paidAt } = req.body;
    const fee = await Fee.findById(feeId);
    if (!fee || fee.studentId !== req.user.uid) return res.status(404).json({ error: "Fee not found" });

    fee.status = "paid";
    fee.transactionId = transactionId;
    fee.paidAt = paidAt;
    await fee.save();
    res.json(fee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
apiRouter.get("/admin/dashboard", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const students = await User.find({ role: "student", tenantId }).select("-password");
    const attendanceRequests = await Attendance.find({ tenantId });
    const marks = await Mark.find({ tenantId });
    const auditLogs = await AuditLog.find({ tenantId }).sort({ createdAt: -1 }).limit(50);
    const tenant = await Tenant.findOne({ tenantId });
    res.json({ students, attendanceRequests, marks, auditLogs, tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes (Continued)
apiRouter.put("/admin/attendance/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { status, updatedAt } = req.body;
    const tenantId = req.user.tenantId;
    const attendance = await Attendance.findOneAndUpdate({ _id: req.params.id, tenantId }, { status, updatedAt }, { new: true });
    
    if (!attendance) return res.status(404).json({ error: "Attendance log not found in this node" });

    // Audit Log
    const adminId = req.user.uid;
    const adminName = req.user.name;
    await new AuditLog({ tenantId, adminId, adminName, action: "UPDATE_ATTENDANCE", targetId: req.params.id, details: `Attendance status updated to ${status}`, category: "attendance", ip: req.ip || "" }).save();

    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/admin/tenant/departments", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { departments } = req.body;
    const tenantId = req.user.tenantId;
    
    let processedDepts: string[] = [];
    if (typeof departments === 'string') {
      processedDepts = departments.split(",").map(d => d.trim()).filter(Boolean);
    } else if (Array.isArray(departments)) {
      processedDepts = departments.filter(d => typeof d === 'string').map(d => d.trim()).filter(Boolean);
    }

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { departments: processedDepts } },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Audit Log
    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "UPDATE_DEPARTMENTS",
      details: `Registry updated to: ${processedDepts.join(", ")}`,
      category: "system",
      ip: req.ip || ""
    }).save();

    res.json({ departments: tenant.departments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/admin/tenant/subjects", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { subjects } = req.body;
    const tenantId = req.user.tenantId;
    
    let processedSubjects: string[] = [];
    if (typeof subjects === 'string') {
      processedSubjects = subjects.split(",").map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(subjects)) {
      processedSubjects = subjects.filter(s => typeof s === 'string').map(s => s.trim()).filter(Boolean);
    }

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: { subjects: processedSubjects } },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Audit Log
    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "UPDATE_SUBJECTS",
      details: `Curriculum updated: ${processedSubjects.join(", ")}`,
      category: "system",
      ip: req.ip || ""
    }).save();

    res.json({ subjects: tenant.subjects });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/api/admin/marks/csv", requireAuth, requireAdmin, async (req: any, res) => {
  // redirect /api/admin/marks/csv to avoid confusion if needed, but we match relative to apiRouter
});

apiRouter.post("/admin/marks/csv", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { headers, rows } = req.body;
    const tenantId = req.user.tenantId;

    if (!headers || !rows || !Array.isArray(headers) || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid CSV data format" });
    }

    // Determine subject headers: any header that is not 'Roll No', 'rollNo', 'Name', 'name', or 'Student Name'
    const subjectHeaders = headers.filter(h => {
      const normalized = h.toLowerCase().replace(/\s/g, "");
      return normalized !== "rollno" && normalized !== "name" && normalized !== "studentname";
    });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    const rollNoKey = headers.find(h => h.toLowerCase().replace(/\s/g, "") === "rollno");
    if (!rollNoKey) {
      return res.status(400).json({ error: "CSV file must contain a 'Roll No' column." });
    }

    for (const row of rows) {
      const rollNoVal = row[rollNoKey];
      if (!rollNoVal) {
        failCount++;
        errors.push("Missing Roll No in some rows");
        continue;
      }

      // Find student by Roll No
      const student = await User.findOne({ tenantId, rollNo: rollNoVal, role: "student" });
      if (!student) {
        failCount++;
        errors.push(`Student with Roll No ${rollNoVal} not found`);
        continue;
      }

      // Upsert marks for each detected subject
      for (const subject of subjectHeaders) {
        const scoreVal = row[subject];
        if (scoreVal === undefined || scoreVal === "") continue;

        const score = parseInt(scoreVal);
        if (isNaN(score) || score < 0 || score > 100) {
          errors.push(`Invalid score ${scoreVal} for student ${student.name} in ${subject}`);
          continue;
        }

        await Mark.findOneAndUpdate(
          { tenantId, studentId: student.uid, subject },
          { $set: { score, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        successCount++;
      }
    }

    // Audit Log
    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "CSV_MARKS_UPLOAD",
      details: `CSV upload completed. Ingested records: ${successCount}. Failures/Warnings: ${failCount}.`,
      category: "marks",
      ip: req.ip || ""
    }).save();

    res.json({ success: true, successCount, failCount, errors: Array.from(new Set(errors)) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/admin/marks/bulk", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { marks } = req.body;
    const tenantId = req.user.tenantId;

    const operations = marks.map((m: any) => ({
      updateOne: {
        filter: { studentId: m.studentId, subject: m.subject, tenantId },
        update: { $set: { score: m.score, updatedAt: new Date().toISOString() } },

        upsert: true
      }
    }));

    await Mark.bulkWrite(operations);

    // Audit Log
    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "BULK_MARKS_UPLOAD",
      details: `Uploaded ${marks.length} marks for various subjects`,
      category: "marks",
      ip: req.ip || ""
    }).save();

    res.json({ success: true, count: marks.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/admin/marks", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { studentId, subject, score, updatedAt } = req.body;
    const tenantId = req.user.tenantId;
    
    let mark = await Mark.findOne({ studentId, subject, tenantId });
    if (mark) {
      mark.score = score;
      mark.updatedAt = updatedAt;
      await mark.save();
    } else {
      mark = new Mark({ tenantId, studentId, subject, score, updatedAt });
      await mark.save();
    }

    // Audit Log
    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "UPDATE_MARKS",
      targetId: studentId,
      details: `Updated marks for ${subject}: ${score}`,
      ip: req.ip || "0.0.0.0"
    }).save();

    res.json(mark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/admin/messages", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const messages = await Message.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

apiRouter.get("/admin/conversations", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    // Get all students for this tenant
    const students = await User.find({ tenantId, role: "student" }).select("uid name rollNo department");
    
    // Group messages by student
    const conversations = await Promise.all(students.map(async (student) => {
      const lastMessage = await Message.findOne({
        tenantId,
        $or: [
          { senderId: student.uid, receiverId: "admin" },
          { senderId: "admin", receiverId: student.uid }
        ]
      }).sort({ createdAt: -1 });
      
      return {
        student,
        lastMessage,
        unreadCount: await Message.countDocuments({ 
          tenantId, 
          senderId: student.uid, 
          receiverId: "admin", 
          isRead: false 
        })
      };
    }));

    // Filter out students with no messages and sort by last message date
    const activeConversations = conversations
      .filter(c => c.lastMessage)
      .sort((a, b) => (b.lastMessage?.createdAt?.getTime() || 0) - (a.lastMessage?.createdAt?.getTime() || 0));

    res.json(activeConversations);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

apiRouter.post("/admin/messages", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { content, timestamp, receiverId } = req.body;
    const tenantId = req.user.tenantId;
    if (!receiverId) return res.status(400).json({ error: "Receiver ID is required" });

    const msg = new Message({
      tenantId,
      senderId: "admin",
      receiverId,
      senderName: "Administration",
      content,
      timestamp: timestamp || new Date().toISOString()
    });
    await msg.save();

    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "DIRECT_MESSAGE",
      targetId: receiverId,
      details: `Sent direct message: ${content.substring(0, 50)}...`,
      ip: req.ip || "0.0.0.0"
    }).save();

    res.json(msg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Fee Routes ─────────────────────────────────────────────────────────────
apiRouter.get("/admin/fees", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const fees = await Fee.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

apiRouter.post("/admin/fees", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { studentId, type, amount, dueDate, description, semester } = req.body;
    const tenantId = req.user.tenantId;

    const student = await User.findOne({ uid: studentId, tenantId });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const fee = new Fee({
      tenantId,
      studentId,
      studentName: student.name,
      type,
      amount,
      dueDate,
      description,
      semester
    });
    await fee.save();

    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "CREATE_FEE",
      targetId: studentId,
      details: `Created ${type} of ₹${amount} for ${student.name}`,
      category: "billing",
      ip: req.ip || "0.0.0.0"
    }).save();

    res.json(fee);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

apiRouter.post("/admin/fees/bulk", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { type, amount, dueDate, semester } = req.body;
    const tenantId = req.user.tenantId;

    const students = await User.find({ tenantId, role: "student" });
    const fees = students.map(s => ({
      tenantId,
      studentId: s.uid,
      studentName: s.name,
      type: type || "Tuition Fee",
      amount: Number(amount),
      dueDate: dueDate || "",
      semester: semester || ""
    }));

    await Fee.insertMany(fees);

    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "BULK_FEE_ASSIGNMENT",
      details: `Assigned ${type} of ₹${amount} to ${students.length} students`,
      category: "billing",
      ip: req.ip || "0.0.0.0"
    }).save();

    res.json({ message: `Successfully assigned fees to ${students.length} students` });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

apiRouter.post("/student/fee/pay", requireAuth, async (req: any, res) => {
  try {
    const { feeId, transactionId } = req.body;
    const { uid, tenantId } = req.user;

    const fee = await Fee.findOneAndUpdate(
      { _id: feeId, studentId: uid, tenantId },
      { status: "paid", paidAt: new Date().toISOString(), transactionId },
      { new: true }
    );

    if (!fee) return res.status(404).json({ error: "Fee record not found or unauthorized" });

    await new AuditLog({
      tenantId,
      adminId: uid,
      adminName: req.user.name,
      action: "FEE_PAYMENT",
      targetId: feeId,
      details: `Paid ${fee.type} of ₹${fee.amount}. TransID: ${transactionId}`,
      category: "billing",
      ip: req.ip || "0.0.0.0"
    }).save();

    res.json(fee);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Super Admin Routes (Multi-Tenancy Management)
apiRouter.get("/superadmin/tenants", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/superadmin/users", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete("/superadmin/tenants/:tenantId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    await Promise.all([
      Tenant.deleteOne({ tenantId }),
      User.deleteMany({ tenantId }),
      Attendance.deleteMany({ tenantId }),
      Mark.deleteMany({ tenantId }),
      Fee.deleteMany({ tenantId }),
      Message.deleteMany({ tenantId }),
      Notification.deleteMany({ tenantId }),
      Timetable.deleteMany({ tenantId }),
      Assignment.deleteMany({ tenantId }),
      AuditLog.deleteMany({ tenantId })
    ]);
    res.json({ message: "Tenant and all associated data purged successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete("/superadmin/tenants/:tenantId/purge", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    await Promise.all([
      User.deleteMany({ tenantId, role: "student" }),
      Attendance.deleteMany({ tenantId }),
      Mark.deleteMany({ tenantId }),
      Fee.deleteMany({ tenantId }),
      Message.deleteMany({ tenantId }),
      Notification.deleteMany({ tenantId }),
      Timetable.deleteMany({ tenantId }),
      Assignment.deleteMany({ tenantId }),
      AuditLog.deleteMany({ tenantId })
    ]);
    res.json({ message: "Institutional data purged. Administration node remains active." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete("/superadmin/users/:uid", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    await Promise.all([
      User.deleteOne({ uid }),
      Attendance.deleteMany({ studentId: uid }),
      Mark.deleteMany({ studentId: uid }),
      Fee.deleteMany({ studentId: uid }),
      Message.deleteMany({ $or: [{ senderId: uid }, { receiverId: uid }] })
    ]);
    res.json({ message: "User identity and associated data purged" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/superadmin/tenants/:tenantId", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    console.log(`[DEBUG] Updating Tenant: ${tenantId}`);
    console.log(`[DEBUG] Incoming Data:`, JSON.stringify(req.body));

    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.tenantId;

    if (updates.departments) {
      if (typeof updates.departments === 'string') {
        updates.departments = updates.departments.split(",").map((d: string) => d.trim()).filter(Boolean);
      } else if (!Array.isArray(updates.departments)) {
        updates.departments = [];
      }
    }

    const tenant = await Tenant.findOneAndUpdate({ tenantId }, { $set: updates }, { new: true });
    if (!tenant) {
       console.log(`[DEBUG] Tenant Not Found: ${tenantId}`);
       return res.status(404).json({ error: "Tenant not found" });
    }
    
    console.log(`[DEBUG] Persisted Departments:`, tenant.departments);
    res.json(tenant);
  } catch (error: any) {
    console.error(`[ERROR] Update Failed:`, error);
    res.status(500).json({ error: error.message });
  }
});



apiRouter.put("/superadmin/users/:uid", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    const user = await User.findOneAndUpdate({ uid }, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
apiRouter.get("/superadmin/stats", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const activeNodes = await Tenant.countDocuments({ status: "active" });
    
    res.json({
      totalTenants,
      totalStudents,
      activeNodes,
      uptime: "99.99%",
      health: "STABLE"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/superadmin/tenants", requireAuth, requireSuperAdmin, async (req: any, res) => {
  try {
    const tenantId = uuidv4();
    const { name, slug, logo, address, adminEmail, adminPassword, adminName, departments } = req.body;
    
    const processedDepartments = typeof departments === 'string' 
      ? departments.split(",").map((d: string) => d.trim()).filter(Boolean) 
      : (Array.isArray(departments) ? departments : []);

    console.log(`[DEBUG] Creating Tenant with departments:`, processedDepartments);
    const tenant = new Tenant({
      tenantId,
      name,
      slug,
      logo,
      address,
      status: "active",
      departments: processedDepartments
    });
    await tenant.save();
    console.log(`[DEBUG] Tenant Created: ${tenantId}`);

    // Create Tenant Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    const admin = new User({
      uid: uuidv4(),
      tenantId,
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: "admin",
      collegeName: name,
      currentSessionId: uuidv4(),
      lastLoginAt: new Date().toISOString()
    });
    await admin.save();

    res.json({ tenant, admin: { email: adminEmail, name: adminName } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// FEE MANAGEMENT (Admin)
// ============================================================
apiRouter.get("/admin/fees", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const fees = await Fee.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/fees", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { studentId, studentName, type, amount, dueDate, description, semester } = req.body;
    const tenantId = req.user.tenantId;
    const fee = new Fee({ tenantId, studentId, studentName, type, amount, dueDate, description, semester });
    await fee.save();
    await new AuditLog({ tenantId, adminId: req.user.uid, adminName: req.user.name, action: "CREATE_FEE", targetId: studentId, details: `Fee of ₹${amount} (${type}) created`, category: "fees", ip: req.ip || "" }).save();
    res.json(fee);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/fees/bulk", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { type, amount, dueDate, description, semester } = req.body;
    const tenantId = req.user.tenantId;
    const students = await User.find({ tenantId, role: "student", isActive: true });
    const fees = students.map(s => ({ tenantId, studentId: s.uid, studentName: s.name, type, amount, dueDate, description, semester, status: "pending" }));
    await Fee.insertMany(fees);
    await new AuditLog({ tenantId, adminId: req.user.uid, adminName: req.user.name, action: "BULK_FEE", details: `Bulk fee ₹${amount} (${type}) assigned to ${students.length} students`, category: "fees", ip: req.ip || "" }).save();
    res.json({ message: `Fee assigned to ${students.length} students` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/admin/fees/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) return res.status(404).json({ error: "Fee not found" });
    res.json(fee);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// NOTIFICATIONS (Admin Broadcast + Student Read)
// ============================================================
apiRouter.get("/admin/notifications", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const notifs = await Notification.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/notifications", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { title, message, type, department, semester } = req.body;
    const notif = new Notification({
      tenantId: req.user.tenantId,
      title,
      message,
      type: type || "info",
      department: department || "",
      semester: semester || ""
    });
    await notif.save();
    res.json(notif);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/student/notifications", requireAuth, async (req: any, res) => {
  try {
    const { uid, tenantId, department, semester } = req.user;
    const notifs = await Notification.find({
      tenantId,
      $and: [
        { $or: [{ userId: null }, { userId: uid }] },
        { $or: [{ department: "" }, { department }] },
        { $or: [{ semester: "" }, { semester }] }
      ]
    }).sort({ createdAt: -1 }).limit(30);
    res.json(notifs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/student/notifications/:id/read", requireAuth, async (req: any, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user.uid }, isRead: true });
    res.json({ message: "Marked as read" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// TIMETABLE (Admin manage + Student view)
// ============================================================
apiRouter.get("/admin/timetable", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { department, section } = req.query;
    const filter: any = { tenantId: req.user.tenantId };
    if (department) filter.department = department;
    if (section) filter.section = section;
    const slots = await Timetable.find(filter).sort({ day: 1, startTime: 1 });
    res.json(slots);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/timetable", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const slot = new Timetable({ ...req.body, tenantId: req.user.tenantId });
    await slot.save();
    res.json(slot);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/admin/timetable/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: "Slot deleted" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/student/timetable", requireAuth, async (req: any, res) => {
  try {
    const { department, section, tenantId, semester } = req.user;
    const filter: any = { tenantId };
    
    if (department) filter.department = department;
    
    // Show slots for their specific semester OR general slots for the whole department (empty semester)
    if (semester) {
      filter.$or = [
        { semester: semester },
        { semester: "" },
        { semester: { $exists: false } }
      ];
    } else {
      filter.semester = "";
    }

    const slots = await Timetable.find(filter).sort({ day: 1, startTime: 1 });
    res.json(slots);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ASSIGNMENTS (Admin manage + Student view)
// ============================================================
apiRouter.get("/admin/assignments", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const assignments = await Assignment.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/assignments", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { title, description, subject, department, semester, section, dueDate, maxMarks } = req.body;
    const assignment = new Assignment({
      tenantId: req.user.tenantId,
      title,
      description,
      subject,
      department: department || "",
      semester: semester || "",
      section: section || "",
      dueDate,
      maxMarks: Number(maxMarks) || 100,
      createdBy: req.user.uid
    });
    await assignment.save();
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/student/assignments", requireAuth, async (req: any, res) => {
  try {
    const { department, semester, tenantId } = req.user;
    const filter: any = {
      tenantId, status: "active",
      $or: [{ department }, { department: "" }, { department: { $exists: false } }]
    };
    if (semester) {
      filter.$and = [{ $or: [{ semester }, { semester: "" }, { semester: { $exists: false } }] }];
    }
    const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/admin/assignments/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const a = await Assignment.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!a) return res.status(404).json({ error: "Assignment not found" });
    await new AuditLog({ tenantId: req.user.tenantId, adminId: req.user.uid, adminName: req.user.name, action: "DELETE_ASSIGNMENT", details: `Deleted: "${a.title}"`, category: "assignments", ip: req.ip || "" }).save();
    res.json({ message: "Assignment deleted" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.patch("/admin/assignments/:id/status", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { status } = req.body;
    if (!["active", "closed"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const a = await Assignment.findOneAndUpdate({ _id: req.params.id, tenantId: req.user.tenantId }, { status }, { new: true });
    if (!a) return res.status(404).json({ error: "Assignment not found" });
    res.json(a);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Notification Delete ────────────────────────────────────────────────────
apiRouter.delete("/admin/notifications/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!n) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Full Message Thread (Admin → Student) ─────────────────────────────────
apiRouter.get("/admin/messages/:studentId", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { studentId } = req.params;
    const tenantId = req.user.tenantId;
    const thread = await Message.find({
      tenantId,
      $or: [
        { senderId: studentId, receiverId: "admin" },
        { senderId: "admin", receiverId: studentId }
      ]
    }).sort({ createdAt: 1 });
    await Message.updateMany({ tenantId, senderId: studentId, receiverId: "admin", isRead: false }, { isRead: true });
    res.json(thread);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Full Message Thread (Student view) ───────────────────────────────────
apiRouter.get("/student/messages", requireAuth, async (req: any, res) => {
  try {
    const { uid, tenantId } = req.user;
    const thread = await Message.find({
      tenantId,
      $or: [
        { senderId: uid, receiverId: "admin" },
        { senderId: "admin", receiverId: uid }
      ]
    }).sort({ createdAt: 1 });
    res.json(thread);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Mark notification read ────────────────────────────────────────────────
apiRouter.put("/student/notifications/read-all", requireAuth, async (req: any, res) => {
  try {
    const { uid, tenantId, department } = req.user;
    await Notification.updateMany(
      { tenantId, $or: [{ userId: uid }, { userId: null, $or: [{ department }, { department: "" }] }] },
      { $addToSet: { readBy: uid } }
    );
    res.json({ message: "All marked as read" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Individual student profile (Admin) ───────────────────────────────────
apiRouter.get("/admin/students/:uid", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const student = await User.findOne({ uid: req.params.uid, tenantId: req.user.tenantId }).select("-password");
    if (!student) return res.status(404).json({ error: "Student not found" });
    const [marks, attendance, fees] = await Promise.all([
      Mark.find({ studentId: req.params.uid, tenantId: req.user.tenantId }),
      Attendance.find({ studentId: req.params.uid, tenantId: req.user.tenantId }).sort({ date: -1 }).limit(30),
      Fee.find({ studentId: req.params.uid, tenantId: req.user.tenantId }),
    ]);
    res.json({ student, marks, attendance, fees });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/admin/students/:uid", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const allowed = ["name", "department", "rollNo", "section", "semester", "year", "phoneNumber", "cgpa", "bloodGroup", "dob", "address", "guardian", "guardianPhone", "isActive", "profilePicture"];
    const updates: any = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const student = await User.findOneAndUpdate({ uid: req.params.uid, tenantId: req.user.tenantId }, updates, { new: true }).select("-password");
    if (!student) return res.status(404).json({ error: "Student not found" });
    await new AuditLog({ tenantId: req.user.tenantId, adminId: req.user.uid, adminName: req.user.name, action: "UPDATE_STUDENT", targetId: req.params.uid, details: `Updated: ${student.name}`, category: "students", ip: req.ip || "" }).save();
    res.json(student);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Attendance with filters ────────────────────────────────────────────────
apiRouter.get("/admin/attendance", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { department, rollNo, subject, status, date } = req.query;
    const filter: any = { tenantId: req.user.tenantId };
    if (department) filter.department = department;
    if (rollNo) filter.rollNo = rollNo;
    if (subject) filter.subject = subject;
    if (status) filter.status = status;
    if (date) filter.date = date;
    const records = await Attendance.find(filter).sort({ date: -1 }).limit(200);
    res.json(records);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/attendance/bulk-approve", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: "No IDs provided" });
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const result = await Attendance.updateMany({ _id: { $in: ids }, tenantId: req.user.tenantId }, { status, updatedAt: new Date().toISOString() });
    await new AuditLog({ tenantId: req.user.tenantId, adminId: req.user.uid, adminName: req.user.name, action: "BULK_ATTENDANCE", details: `Bulk ${status} for ${ids.length} records`, category: "attendance", ip: req.ip || "" }).save();
    res.json({ message: `${result.modifiedCount} records updated` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/admin/attendance/bulk", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { date, records } = req.body;
    const tenantId = req.user.tenantId;
    if (!date || !Array.isArray(records) || !records.length) {
      return res.status(400).json({ error: "Invalid date or records payload" });
    }

    const operations = records.map((r: any) => ({
      updateOne: {
        filter: { studentId: r.studentId, date, tenantId },
        update: { 
          $set: { 
            studentName: r.studentName,
            status: r.status, // "approved" or "rejected"
            submittedAt: new Date().toISOString()
          } 
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    // Audit Log
    await new AuditLog({
      tenantId,
      adminId: req.user.uid,
      adminName: req.user.name,
      action: "BULK_ATTENDANCE_UPLOAD",
      details: `Uploaded attendance for ${records.length} students on ${date}`,
      category: "attendance",
      ip: req.ip || ""
    }).save();

    res.json({ success: true, count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics snapshot ────────────────────────────────────────────────────
apiRouter.get("/admin/analytics", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [totalStudents, activeStudents, totalFees, paidFees, pendingFeeAgg, approvedAtt, totalAtt, assignmentCount, messageCount] = await Promise.all([
      User.countDocuments({ tenantId, role: "student" }),
      User.countDocuments({ tenantId, role: "student", isActive: true }),
      Fee.countDocuments({ tenantId }),
      Fee.countDocuments({ tenantId, status: "paid" }),
      Fee.aggregate([{ $match: { tenantId, status: "pending" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Attendance.countDocuments({ tenantId, status: "approved" }),
      Attendance.countDocuments({ tenantId }),
      Assignment.countDocuments({ tenantId, status: "active" }),
      Message.countDocuments({ tenantId, receiverId: "admin", isRead: false }),
    ]);
    res.json({
      totalStudents, activeStudents,
      totalFees, paidFees, pendingDues: pendingFeeAgg[0]?.total || 0,
      attendanceRate: totalAtt > 0 ? Math.round((approvedAtt / totalAtt) * 100) : 0,
      feeCollectionRate: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0,
      assignmentCount, unreadMessages: messageCount,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Student management ────────────────────────────────────────────────────
apiRouter.put("/admin/students/:uid/deactivate", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const student = await User.findOneAndUpdate({ uid: req.params.uid, tenantId: req.user.tenantId }, { isActive: false }, { new: true });
    if (!student) return res.status(404).json({ error: "Student not found" });
    await new AuditLog({ tenantId: req.user.tenantId, adminId: req.user.uid, adminName: req.user.name, action: "DEACTIVATE_STUDENT", targetId: req.params.uid, details: `Deactivated: ${student.name}`, category: "students", ip: req.ip || "" }).save();
    res.json({ message: "Student deactivated" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/admin/students/:uid/activate", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    await User.findOneAndUpdate({ uid: req.params.uid, tenantId: req.user.tenantId }, { isActive: true });
    res.json({ message: "Student activated" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Super Admin ───────────────────────────────────────────────────────────
apiRouter.get("/superadmin/tenants/:tenantId/stats", requireAuth, requireSuperAdmin, async (req: any, res) => {
  try {
    const { tenantId } = req.params;
    const [students, admins, totalFees, paidFees, totalAttendance, activeAssignments] = await Promise.all([
      User.countDocuments({ tenantId, role: "student" }),
      User.countDocuments({ tenantId, role: "admin" }),
      Fee.countDocuments({ tenantId }),
      Fee.countDocuments({ tenantId, status: "paid" }),
      Attendance.countDocuments({ tenantId, status: "approved" }),
      Assignment.countDocuments({ tenantId, status: "active" }),
    ]);
    res.json({ students, admins, totalFees, paidFees, totalAttendance, activeAssignments });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/superadmin/tenants/:tenantId/toggle", requireAuth, requireSuperAdmin, async (req: any, res) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    tenant.status = tenant.status === "active" ? "suspended" : "active";
    await tenant.save();
    res.json({ message: `College ${tenant.status}`, status: tenant.status });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// Purging duplicates... (removed duplicate routes)

// ============================================================
// ASSIGNMENT SUBMISSIONS
// ============================================================

// Student: submit or resubmit an assignment
apiRouter.post("/student/assignments/:id/submit", requireAuth, async (req: any, res) => {
  try {
    const { uid, tenantId, name, rollNo, department } = req.user;
    const { textContent, fileName, fileData, fileType } = req.body;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findOne({ _id: assignmentId, tenantId, status: "active" });
    if (!assignment) return res.status(404).json({ error: "Assignment not found or already closed" });

    const isLate = new Date() > new Date(assignment.dueDate);

    // Block resubmission if already graded
    const existing = await AssignmentSubmission.findOne({ assignmentId: assignmentId.toString(), studentId: uid });
    if (existing?.status === "graded") {
      return res.status(403).json({ error: "This assignment has already been graded and cannot be resubmitted." });
    }

    // Block any submission after due date
    if (isLate) {
      return res.status(403).json({ error: "The submission deadline has passed. This assignment is now closed for submissions." });
    }

    const submittedAt = new Date().toISOString();

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: assignmentId.toString(), studentId: uid },
      {
        tenantId, assignmentId: assignmentId.toString(), studentId: uid,
        studentName: name, rollNo: rollNo || "", department: department || "",
        textContent: textContent || "",
        fileName: fileName || "", fileData: fileData || "", fileType: fileType || "",
        submittedAt, status: isLate ? "late" : "submitted",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: isLate ? "Submitted (late)" : "Submitted successfully", submission });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Student: check own submission status for an assignment
apiRouter.get("/student/assignments/:id/submission", requireAuth, async (req: any, res) => {
  try {
    const submission = await AssignmentSubmission.findOne({
      assignmentId: req.params.id,
      studentId: req.user.uid,
      tenantId: req.user.tenantId
    }).select("-fileData");
    res.json(submission || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Admin: get all submissions for an assignment + non-submitters
apiRouter.get("/admin/assignments/:id/submissions", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const assignmentId = req.params.id;
    const tenantId = req.user.tenantId;

    const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const submissions = await AssignmentSubmission.find({ assignmentId, tenantId })
      .select("-fileData").sort({ submittedAt: 1 });

    const studentFilter: any = { tenantId, role: "student", isActive: true };
    if (assignment.department) studentFilter.department = assignment.department;
    const allStudents = await User.find(studentFilter)
      .select("uid name rollNo department section email");

    const submittedIds = new Set(submissions.map((s: any) => s.studentId));
    const nonSubmitters = allStudents.filter((s: any) => !submittedIds.has(s.uid));

    res.json({
      assignment,
      submissions,
      nonSubmitters,
      stats: {
        total: allStudents.length,
        submitted: submissions.length,
        late: submissions.filter((s: any) => s.status === "late").length,
        graded: submissions.filter((s: any) => s.status === "graded").length,
        pending: allStudents.length - submissions.length,
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Admin: get file for a specific submission
apiRouter.get("/admin/submissions/:submissionId/file", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const sub = await AssignmentSubmission.findOne({ _id: req.params.submissionId, tenantId: req.user.tenantId });
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    if (!sub.fileData && !sub.textContent) return res.status(404).json({ error: "No content attached" });
    res.json({ fileName: sub.fileName, fileType: sub.fileType, fileData: sub.fileData, textContent: sub.textContent });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Admin: grade a submission
apiRouter.put("/admin/submissions/:submissionId/grade", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { score, feedback } = req.body;
    if (score === undefined) return res.status(400).json({ error: "Score is required" });
    const sub = await AssignmentSubmission.findOneAndUpdate(
      { _id: req.params.submissionId, tenantId: req.user.tenantId },
      { score, feedback: feedback || "", status: "graded", gradedBy: req.user.uid, gradedAt: new Date().toISOString() },
      { new: true }
    ).select("-fileData");
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    await new AuditLog({ tenantId: req.user.tenantId, adminId: req.user.uid, adminName: req.user.name, action: "GRADE_SUBMISSION", targetId: sub.studentId, details: `Score: ${score} for assignment ${sub.assignmentId}`, category: "assignments", ip: req.ip || "" }).save();
    res.json(sub);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Admit Card Routes ───────────────────────────────────────────────────
apiRouter.post("/admin/admit-cards", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { department, examName, schedules, semester, isGenerated } = req.body;
    const tenantId = req.user.tenantId;

    if (!department || !examName) return res.status(400).json({ error: "Department and Exam Name are required" });

    const admitCard = await AdmitCard.findOneAndUpdate(
      { tenantId, department, semester: semester || "" },
      { examName, schedules, isGenerated: !!isGenerated },
      { new: true, upsert: true }
    );

    await new AuditLog({ 
      tenantId, 
      adminId: req.user.uid, 
      adminName: req.user.name, 
      action: isGenerated ? "GENERATE_ADMIT_CARD" : "UPDATE_EXAM_SCHEDULE", 
      targetId: department, 
      details: `${examName} for ${department}`, 
      category: "system",
      ip: req.ip || ""
    }).save();

    res.json(admitCard);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/admin/admit-cards", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const cards = await AdmitCard.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/student/admit-card", requireAuth, async (req: any, res) => {
  try {
    const { tenantId, department, semester } = req.user;
    
    if (!department || !semester) {
      return res.status(400).json({ error: "Your profile node is incomplete. Please update your Department and Semester in settings." });
    }

    const card = await AdmitCard.findOne({ 
      tenantId, 
      department,
      semester,
      isGenerated: true 
    });

    if (!card) return res.status(404).json({ error: "The institution has not yet generated an admit card for your department/semester node." });
    res.json(card);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/student/dashboard", requireAuth, async (req: any, res) => {
  try {
    const { uid, tenantId, department, semester, section } = req.user;
    
    const [attendance, marks, fees, timetable, messages, notifications, assignments] = await Promise.all([
      Attendance.find({ studentId: uid, tenantId }),
      Mark.find({ studentId: uid, tenantId }),
      Fee.find({ studentId: uid, tenantId }),
      Timetable.find({ tenantId, department }),
      Message.find({ 
        tenantId, 
        $or: [{ senderId: uid }, { receiverId: uid }] 
      }).sort({ createdAt: 1 }),
      Notification.find({ tenantId }).sort({ createdAt: -1 }),
      Assignment.find({ 
        tenantId, 
        $and: [
          { $or: [{ department: "" }, { department: { $exists: false } }, { department: null }, { department }] },
          { $or: [{ semester: "" }, { semester: { $exists: false } }, { semester: null }, { semester }] }
        ]
      }).sort({ createdAt: -1 })
    ]);

    // Attach submissions to assignments
    const assignmentsWithSubmissions = await Promise.all(assignments.map(async (a: any) => {
      const submission = await AssignmentSubmission.findOne({ assignmentId: a._id.toString(), studentId: uid });
      return { ...a.toObject(), submission };
    }));

    res.json({
      profile: {
        uid: req.user.uid,
        tenantId: req.user.tenantId,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        enrollmentId: req.user.enrollmentId,
        phoneNumber: req.user.phoneNumber,
        profilePicture: req.user.profilePicture,
        department: req.user.department,
        rollNo: req.user.rollNo,
        section: req.user.section,
        semester: req.user.semester,
        collegeName: req.user.collegeName
      },
      attendance,
      marks,
      fees,
      timetable,
      messages,
      notifications,
      assignments: assignmentsWithSubmissions
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
