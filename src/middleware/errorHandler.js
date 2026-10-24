export const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route nahi mila: ${req.originalUrl}` });

export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.code === 11000) { status = 409; message = 'Yeh email pehle se registered hai'; }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = 'Image 2MB se choti honi chahiye'; }

  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message });
};
