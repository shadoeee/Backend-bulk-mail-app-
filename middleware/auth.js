import jwt from "jsonwebtoken";

export const auth = (request, response, next) => {
    try {
        const token = request.header("x-auth-token");
        if (!token) {
            return response.status(401).json({ message: "Access denied. No token provided." });
        }
        const decoded = jwt.verify(token, process.env.SECURE_KEY);
        request.user = decoded; // Set user information in the request if needed
        next();
    } catch (error) {
        response.status(401).json({ message: "Invalid token." });
    }
}
