exports.main = async (event, context) => {
  const type = event.type || 'excel'
  const url = type === 'excel' ? 'https://example.com/report.xlsx' : 'https://example.com/report.pdf'
  return { url }
}