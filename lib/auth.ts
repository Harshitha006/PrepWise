import { getCurrentUser } from "./actions/auth.action";

export async function getUserId() {
    const user = await getCurrentUser();
    return user?.id || "anonymous";
}
