import type { NextPage } from "next";

const NoteListPage: NextPage = () => {
    return (
        <>
            <form action="/api/notes" method="post">
                <input type="file" />
                <button type="submit">上傳</button>
            </form>
        </>
    );
};

export default NoteListPage;