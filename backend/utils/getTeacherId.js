/**
 * getTeacherId — finds the teacher a student belongs to.
 *
 * Priority:
 * 1. User.createdBy         (students created after isolation fix)
 * 2. Student.createdBy      (fallback via Student document)
 *
 * NOTE: The old "only one teacher in system" fallback has been REMOVED.
 * That fallback breaks multi-teacher isolation — when a second teacher
 * registers, students whose User.createdBy is missing would get assigned
 * to an arbitrary teacher. The correct fix is to always set User.createdBy
 * at student-creation time (done in studentController.createStudent).
 */
const User    = require('../models/User');
const Student = require('../models/Student');

const getTeacherId = async (req) => {
  try {
    const studentUser = await User.findById(req.user._id);

    // 1. Primary — User.createdBy (set on all new students)
    if (studentUser?.createdBy) return studentUser.createdBy;

    // 2. Fallback — Student.createdBy
    if (studentUser?.studentRef) {
      const studentDoc = await Student.findById(studentUser.studentRef);
      if (studentDoc?.createdBy) return studentDoc.createdBy;
    }

  } catch (err) {
    console.error('getTeacherId error:', err.message);
  }
  return null;
};

module.exports = getTeacherId;
