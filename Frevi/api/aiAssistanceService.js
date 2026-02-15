import axios from "axios";

const aiAssistanceService = axios.create({
    baseURL: 'http://localhost:9191/api/ai',
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { description, skills, experience, location } = req.body;

        try {
            const response = await aiAssistanceService.post('/job-recommendations', {
                description,
                skills,
                experience,
                location
            });

            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const getJobRecommendations = (userData) => aiAssistanceService.post('/job-recommendations', userData);
export const getJobMarketAnalysis = () => aiAssistanceService.get('/market-analysis');
export const getSkillSuggestions = (currentSkills) => aiAssistanceService.post('/skill-suggestions', { currentSkills });
export const getCareerPath = (userProfile) => aiAssistanceService.post('/career-path', userProfile);
export const analyzeResume = (resumeText) => aiAssistanceService.post('/analyze-resume', { resumeText });