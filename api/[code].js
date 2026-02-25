// api/redirect/[code].js
export default async function handler(req, res) {
  const { code } = req.query;
  
  // In production, you'd look up the code in a database
  // For now, redirect to home
  res.redirect(302, '/');
}