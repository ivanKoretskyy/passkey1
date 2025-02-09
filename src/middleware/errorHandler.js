export const handleError = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.log(message)
    res.status(statusCode).send({ error: message });
};
