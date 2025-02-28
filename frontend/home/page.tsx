import { MainContent } from "./main";

export default function Page() {
    return (
        <div className={`w-full bg-background rounded-3xl flex-grow`}>
            <MainContent />
        </div>
    );
}
