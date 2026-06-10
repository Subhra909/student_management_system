import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/edunexus";
  
  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast on Vercel to return a clean 503 instead of timing out the function
    socketTimeoutMS: 45000,
  }).then((m) => {
    console.log("✅ MongoDB Connected");
    return m;
  }).catch((error) => {
    console.error("=========================================");
    console.error("ERROR: Could not connect to MongoDB!");
    console.error(error);
    console.error("=========================================");
    connectionPromise = null; // Reset promise on failure so we can retry on subsequent requests
    throw error;
  });

  // Graceful shutdown listener (only attach once)
  if (process.listeners("SIGINT").length === 0) {
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  }

  return connectionPromise;
}

// ─── Tenant ────────────────────────────────────────────────────────────────
const tenantSchema = new mongoose.Schema({
  tenantId:  { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  slug:      { type: String, required: true, unique: true },
  logo:      { type: String, default: "" },
  address:   { type: String, default: "" },
  website:   { type: String, default: "" },
  phone:     { type: String, default: "" },
  email:     { type: String, default: "" },
  establishedYear: { type: String, default: "" },
  config: {
    primaryColor:   { type: String, default: "#4f46e5" },
    accentColor:    { type: String, default: "#7c3aed" },
    allowedDomains: [{ type: String }],
  },
  status:       { type: String, enum: ["active", "suspended"], default: "active" },
  departments:  { type: [String], default: [] },
  subjects:     { type: [String], default: ["Mathematics", "Physics", "Chemistry"] },
  studentCount: { type: Number, default: 0 },
}, { timestamps: true });

// ─── User ─────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  uid:              { type: String, required: true, unique: true },
  tenantId:         { type: String, required: true },
  email:            { type: String, required: true },
  password:         { type: String, required: true },
  name:             { type: String, required: true },
  role:             { type: String, enum: ["student", "admin", "superadmin"], required: true },
  phoneNumber:      { type: String, default: "" },
  profilePicture:   { type: String, default: "" },
  bio:              { type: String, default: "" },
  department:       { type: String, default: "" },
  rollNo:           { type: String, default: "" },
  section:          { type: String, default: "" },
  semester:         { type: String, default: "" },
  year:             { type: String, default: "" },
  collegeName:      { type: String, default: "" },
  currentSessionId: { type: String },
  enrollmentId:     { type: String },
  lastLoginAt:      { type: String },
  lastLoginIp:      { type: String },
  isActive:         { type: Boolean, default: true },
  cgpa:             { type: Number, default: 0 },
  bloodGroup:       { type: String, default: "" },
  dob:              { type: String, default: "" },
  address:          { type: String, default: "" },
  guardian:         { type: String, default: "" },
  guardianPhone:    { type: String, default: "" },
}, { timestamps: true });

userSchema.index({ email: 1, tenantId: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, department: 1 });

// ─── Attendance ───────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  tenantId:    { type: String, required: true },
  studentId:   { type: String, required: true },
  studentName: { type: String, required: true },
  department:  { type: String, default: "" },
  rollNo:      { type: String, default: "" },
  date:        { type: String, required: true },
  subject:     { type: String, default: "" },
  status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  submittedAt: { type: String, required: true },
  updatedAt:   { type: String },
  remarks:     { type: String, default: "" },
}, { timestamps: true });

attendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, department: 1 });
attendanceSchema.index({ tenantId: 1, status: 1 });

// ─── Mark ─────────────────────────────────────────────────────────────────
const markSchema = new mongoose.Schema({
  tenantId:   { type: String, required: true },
  studentId:  { type: String, required: true },
  subject:    { type: String, required: true },
  score:      { type: Number, required: true },
  maxScore:   { type: Number, default: 100 },
  examType:   { type: String, enum: ["internal", "external", "assignment", "quiz", "practical"], default: "internal" },
  semester:   { type: String, default: "" },
  department: { type: String, default: "" },
  grade:      { type: String, default: "" },
  updatedAt:  { type: String, required: true },
}, { timestamps: true });

markSchema.index({ tenantId: 1, studentId: 1 });
markSchema.index({ tenantId: 1, department: 1 });

// ─── Fee ──────────────────────────────────────────────────────────────────
const feeSchema = new mongoose.Schema({
  tenantId:      { type: String, required: true },
  studentId:     { type: String, required: true },
  studentName:   { type: String, default: "" },
  type:          { type: String, required: true },
  amount:        { type: Number, required: true },
  dueDate:       { type: String, default: "" },
  status:        { type: String, enum: ["pending", "paid", "overdue", "waived"], default: "pending" },
  paidAt:        { type: String },
  transactionId: { type: String },
  description:   { type: String, default: "" },
  semester:      { type: String, default: "" },
}, { timestamps: true });

feeSchema.index({ tenantId: 1, studentId: 1 });
feeSchema.index({ tenantId: 1, status: 1 });

// ─── Message ──────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  tenantId:   { type: String, required: true },
  senderId:   { type: String, required: true },
  receiverId: { type: String, required: true },
  senderName: { type: String, required: true },
  content:    { type: String, required: true },
  timestamp:  { type: String, required: true },
  isRead:     { type: Boolean, default: false },
  type:       { type: String, enum: ["message", "announcement", "alert"], default: "message" },
  priority:   { type: String, enum: ["normal", "high", "urgent"], default: "normal" },
}, { timestamps: true });

messageSchema.index({ tenantId: 1, senderId: 1, receiverId: 1 });
messageSchema.index({ tenantId: 1, receiverId: 1, isRead: 1 });

// ─── Audit Log ────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  tenantId:  { type: String, required: true },
  adminId:   { type: String, required: true },
  adminName: { type: String, required: true },
  action:    { type: String, required: true },
  targetId:  { type: String },
  details:   { type: String },
  ip:        { type: String },
  category:  { type: String, enum: ["attendance", "marks", "fees", "students", "messages", "system", "timetable", "assignments", "notifications"], default: "system" },
}, { timestamps: true });

auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, category: 1 });

// ─── Notification ─────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  tenantId:   { type: String, required: true },
  userId:     { type: String, default: null }, // null = broadcast
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  type:       { type: String, enum: ["info", "success", "warning", "alert", "announcement"], default: "info" },
  department: { type: String, default: "" }, // "" = all departments
  semester:   { type: String, default: "" }, // "" = all semesters
  isRead:     { type: Boolean, default: false },
  link:       { type: String, default: "" },
  readBy:     [{ type: String }],
}, { timestamps: true });

notificationSchema.index({ tenantId: 1, createdAt: -1 });
notificationSchema.index({ tenantId: 1, department: 1 });

// ─── Timetable ────────────────────────────────────────────────────────────
const timetableSchema = new mongoose.Schema({
  tenantId:    { type: String, required: true },
  department:  { type: String, required: true },
  section:     { type: String, default: "" },
  semester:    { type: String, default: "" },
  day:         { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
  startTime:   { type: String, required: true },
  endTime:     { type: String, required: true },
  subject:     { type: String, required: true },
  teacherName: { type: String, default: "" },
  room:        { type: String, default: "" },
  type:        { type: String, enum: ["lecture", "lab", "tutorial", "seminar"], default: "lecture" },
}, { timestamps: true });

timetableSchema.index({ tenantId: 1, department: 1, day: 1 });

// ─── Assignment ───────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  tenantId:    { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  subject:     { type: String, required: true },
  department:  { type: String, default: "" }, // "" = global
  semester:    { type: String, default: "" }, // "" = all semesters
  section:     { type: String, default: "" }, // "" = all sections
  dueDate:     { type: String, required: true },
  maxMarks:    { type: Number, default: 100 },
  createdBy:   { type: String, required: true },
  status:      { type: String, enum: ["active", "closed"], default: "active" },
}, { timestamps: true });

assignmentSchema.index({ tenantId: 1, department: 1, status: 1 });
assignmentSchema.index({ tenantId: 1, dueDate: 1 });

// ─── AssignmentSubmission ─────────────────────────────────────────────────
const assignmentSubmissionSchema = new mongoose.Schema({
  tenantId:       { type: String, required: true },
  assignmentId:   { type: String, required: true }, // ref to Assignment._id
  studentId:      { type: String, required: true }, // ref to User.uid
  studentName:    { type: String, required: true },
  rollNo:         { type: String, default: "" },
  department:     { type: String, default: "" },
  textContent:    { type: String, default: "" }, // written answer
  fileName:       { type: String, default: "" }, // original file name
  fileData:       { type: String, default: "" }, // base64 encoded file (max ~4MB)
  fileType:       { type: String, default: "" }, // MIME type
  submittedAt:    { type: String, required: true },
  status:         { type: String, enum: ["submitted", "late", "graded"], default: "submitted" },
  score:          { type: Number },             // graded score
  feedback:       { type: String, default: "" }, // admin feedback
  gradedBy:       { type: String, default: "" }, // admin uid
  gradedAt:       { type: String, default: "" },
}, { timestamps: true });

assignmentSubmissionSchema.index({ tenantId: 1, assignmentId: 1 });
assignmentSubmissionSchema.index({ tenantId: 1, studentId: 1 });
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true }); // one submission per student per assignment

// ─── AdmitCard ────────────────────────────────────────────────────────────
const admitCardSchema = new mongoose.Schema({
  tenantId:    { type: String, required: true },
  department:  { type: String, required: true },
  examName:    { type: String, required: true },
  isGenerated: { type: Boolean, default: false },
  semester:    { type: String, default: "" },
  schedules: [{
    subject: { type: String, required: true },
    date:    { type: String, required: true },
    time:    { type: String, required: true },
    room:    { type: String, default: "" }
  }],
}, { timestamps: true });

admitCardSchema.index({ tenantId: 1, department: 1, semester: 1 }, { unique: true });

// ─── Exports ──────────────────────────────────────────────────────────────
export const Tenant     = mongoose.model("Tenant",     tenantSchema);
export const User       = mongoose.model("User",       userSchema);
export const Attendance = mongoose.model("Attendance", attendanceSchema);
export const Mark       = mongoose.model("Mark",       markSchema);
export const Fee        = mongoose.model("Fee",        feeSchema);
export const Message    = mongoose.model("Message",    messageSchema);
export const AuditLog   = mongoose.model("AuditLog",   auditLogSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const Timetable  = mongoose.model("Timetable",  timetableSchema);
export const Assignment = mongoose.model("Assignment", assignmentSchema);
export const AssignmentSubmission = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
export const AdmitCard = mongoose.model("AdmitCard", admitCardSchema);
