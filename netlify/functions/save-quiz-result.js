const { google } = require('googleapis');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const quizData = JSON.parse(event.body);

        // Authenticate with Google Sheets using Service Account
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID; // Your Google Sheet ID from Netlify Environment Variable

        // Prepare the row data to append to the sheet
        const rowData = [
            new Date().toLocaleString(), // Timestamp of submission
            quizData.name,
            quizData.studentId,
            quizData.class || 'SSS 2', // Assuming class is SSS 3 or passed from frontend
            quizData.score,
            quizData.totalQuestions,
            quizData.percentage,
            quizData.startTime,
            quizData.endTime,
            JSON.stringify(quizData.questionOrder), // Store question order as JSON string
            JSON.stringify(quizData.answers), // Store detailed answers as JSON string
        ];

        // Append the row to your Google Sheet
        await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: 'Sheet1!A:K', // Adjust 'Sheet1' if your sheet has a different name, and 'K' if you have more columns
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowData],
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Quiz results saved successfully!' }),
        };

    } catch (error) {
        console.error('Error saving quiz results to Google Sheet:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save quiz results.', details: error.message }),
        };
    }
};