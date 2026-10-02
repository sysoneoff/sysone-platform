export default function Loading() {
  return (
    <div className="v42LoadingPage" role="status" aria-label="Loading page">
      <div className="shell">
        <div className="v42LoadingPanel">
          <div className="v42LoadingTop">
            <span className="v42LoadingIcon"/>
            <span className="v42LoadingLine short"/>
          </div>

          <span className="v42LoadingLine title"/>
          <span className="v42LoadingLine title second"/>
          <span className="v42LoadingLine text"/>
          <span className="v42LoadingLine text narrow"/>

          <div className="v42LoadingActions">
            <span/>
            <span/>
          </div>
        </div>
      </div>
    </div>
  );
}
