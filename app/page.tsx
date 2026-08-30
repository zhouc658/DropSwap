import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link href="/" className="text-2xl font-bold">
          DropSwap
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-full border border-black px-5 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]">
          Student Collaboration Network
        </p>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Find the skills you&apos;re missing.
          <br />
          Build something better together.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8">
          DropSwap helps students find collaborators based on what they can
          offer, what they need, and how they actually want to work together.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-black px-8 py-4 font-medium text-white transition hover:opacity-80"
          >
            Create My Profile
          </Link>

          <a
            href="#how-it-works"
            className="rounded-full border border-black px-8 py-4 font-medium transition hover:bg-black hover:text-white"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-black px-8 py-24 md:px-16"
      >
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]">
            How It Works
          </p>

          <h2 className="mb-16 text-4xl font-bold md:text-5xl">
            From skill gap to collaboration.
          </h2>

          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="mb-4 text-sm font-medium">01</p>
              <h3 className="mb-3 text-2xl font-semibold">
                Build Your Profile
              </h3>
              <p className="leading-7">
                Tell us about your experience, skills, projects, and what
                you&apos;re currently stuck on.
              </p>
            </div>

            <div>
              <p className="mb-4 text-sm font-medium">02</p>
              <h3 className="mb-3 text-2xl font-semibold">
                Find Your Match
              </h3>
              <p className="leading-7">
                Our matching system looks for students whose skills fill your
                gaps and whose needs connect with yours.
              </p>
            </div>

            <div>
              <p className="mb-4 text-sm font-medium">03</p>
              <h3 className="mb-3 text-2xl font-semibold">
                Build Together
              </h3>
              <p className="leading-7">
                Connect, test the collaboration, and turn the match into a real
                project.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}