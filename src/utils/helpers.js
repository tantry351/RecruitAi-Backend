function generateCandidateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CND-${timestamp}-${random}`;
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidPhone(phone) {
    const regex = /^[0-9]{10,15}$/;
    return regex.test(phone.replace(/[-\s]/g, ''));
}

module.exports = { generateCandidateId, isValidEmail, isValidPhone };
