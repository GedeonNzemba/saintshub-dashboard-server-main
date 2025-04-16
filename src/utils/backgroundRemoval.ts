
export default async function imageRemover(selectedFile: string) {
    const formData = new FormData();
    formData.append("image_file", selectedFile);
    formData.append("size", "auto");

    const api_key = "yahxkJ1UbAHVcqb7TdP8swu5";

    // send to the server
    await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
            "X-Api-Key": api_key,
        },
        body: formData,
    })
        .then((response) => {
            return response.blob();
        })
        .then((blob) => {
            console.log(blob);
            const url = URL.createObjectURL(blob);
            return url
        })
        .catch();
}
