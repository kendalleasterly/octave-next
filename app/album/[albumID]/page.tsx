function Album({params}:{params:{albumID:string}}) {
    return (
        <div>
            <p>album id: {params.albumID}</p>
        </div>
    );
}

export default Album;