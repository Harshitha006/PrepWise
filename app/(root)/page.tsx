import { getUserId } from "@/lib/auth";
import PageLayout from "@/components/PageLayout";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
    const userId = await getUserId();

    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                <HomeClient userId={userId} />
            </div>
        </PageLayout>
    );
}
