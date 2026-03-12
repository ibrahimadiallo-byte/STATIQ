export function NewsPage() {
  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          News feed
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">
          Latest Headlines
        </h2>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">
          Real-time updates from leagues and clubs.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {[
          "Title race tightens after derby draw",
          "UCL spots: key fixtures this weekend",
          "Injury update: midfield star returns",
          "Manager reacts to late comeback win",
        ].map((headline) => (
          <div
            key={headline}
            className="rounded-2xl bg-[#0f152d] px-4 py-4 shadow-lg"
          >
            <p className="text-sm font-semibold">{headline}</p>
            <p className="mt-2 text-xs text-white/60">
              Data: Live feed · Updated just now
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
