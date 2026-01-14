export const validate = (schema) => (req, res, next) => {
  try {
    // parse = validate + transform
    const result = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    req.validated = result;
    next();
  } catch (err) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.errors?.map(e => ({
        path: e.path.join("."),
        message: e.message,
      })) ?? err,
    });
  }
};
