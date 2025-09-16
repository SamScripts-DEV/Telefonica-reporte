import { api_endpoints } from "@/constants/api-endpoints"
import api from "../utils"
import { QuestionCreateRequest } from "@/types/forms-types"

export const questionsApi = {
  createQuestion: async (questionData: QuestionCreateRequest) => {
    try {
      const response = await api.post(api_endpoints.questions.createQuestion, questionData)
      return response.data
    } catch (error) {
      console.error("Error creating question:", error)
      throw error
    }
  },

  createMultipleQuestions: async (questions: QuestionCreateRequest[]) => {
    try {
      const promises = questions.map(question =>
        api.post(api_endpoints.questions.createQuestion, question)
      )
      const responses = await Promise.all(promises)
      return responses.map(response => response.data)
    } catch (error) {
      console.error("Error creating multiple questions:", error)
      throw error
    }
  }
}