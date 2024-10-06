import { buildApiUrl } from "../constants"
import { TApiResponse } from "../types/Api"
import { TMessageDTO } from "../types/messages"
import { EHTTPMethod, fetchRequest } from "./fetch"

export const useSetMessagesRead = () => {
    const setMessagesRead = async (messageIds: string[] = []) => {
		await fetchRequest<{ ids: string[] }, TApiResponse<TMessageDTO[]>>(
			buildApiUrl('/messages/read?'),
			{
				method: EHTTPMethod.PATCH,
				body: {
					ids: messageIds,
				},
			}
		)
    }

    return { setMessagesRead }
}