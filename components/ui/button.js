export default function Button({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        background: "#1d90f5",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        marginTop: "10px",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}
