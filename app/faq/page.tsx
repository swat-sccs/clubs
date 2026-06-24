import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Swat Clubs",
  description: "Frequently asked questions about Swat Clubs.",
};

export default function FAQPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-16">
      <h1 className="font-heading text-4xl font-bold text-foreground">
        Frequently Asked Questions
      </h1>

      <div className="mt-10 flex flex-col gap-10">
        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            What is Swat Clubs?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            Swat Clubs is meant to be your central source of information
            about student organizations at Swarthmore College. Keep
            discovering new clubs throughout the year, not just at the
            Activities Fair. If you are looking for official college support
            resources, check out the Office of Student Engagement.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            How can I provide feedback?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            We&apos;re so excited to let everyone at Swarthmore contribute to the
            development of Swat Clubs! Your feedback is incredibly important
            to us. Have any questions or comments? Found any bugs?{" "}
            <a
              href="mailto:sccs@sccs.swarthmore.edu"
              className="font-medium text-sccs underline"
            >
              Please let us know.
            </a>
          </p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            Why do I have to log in?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            Logging in allows us to create an account for you on Swat Clubs.
            This gives you access to many useful features!
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-foreground/90">
            <li>
              When you bookmark a club, it will be saved to your bookmarked
              list. You can use this to keep track of clubs you&apos;re interested
              in, or a part of.
            </li>
            <li>
              When you subscribe to a club, you&apos;ll receive notifications
              about that club. The club will also be able to add you to
              their mailing lists.
            </li>
            <li>You&apos;ll be able to see events that clubs post to Swat Clubs.</li>
            <li>You can also be invited to join club member lists.</li>
            <li>
              Finally, you&apos;ll need to log in if you want to use your
              administrator permissions to edit a club page.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            How do I use this site?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            The #1 way to use this site is to browse clubs at Swarthmore
            College! You can:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-foreground/90">
            <li>
              Search for clubs by name, and use filters like Tags,
              Affiliation, Size, General Membership Process, and Recruiting
              Cycle.
            </li>
            <li>Bookmark clubs to keep track of them.</li>
            <li>
              Browse information that clubs post: description, how to get
              involved, or services that are offered.
            </li>
          </ul>
          <p className="mt-3 text-base leading-7 text-foreground/90">
            If you run a club, make sure your club has a page on Swat Clubs!
            This lets other students find out about your organization and
            how to get involved.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            How do I edit an organization&apos;s profile?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            You&apos;ll need to have administrator permission for that
            organization. We originally invited people as administrators
            based on information submitted by clubs to Student Council
            during Fall 2025.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-foreground/90">
            <li>
              If you did not receive administrator permission and you
              believe you should have, let us know at{" "}
              <a
                href="mailto:studentorgs@swarthmore.edu"
                className="font-medium text-sccs underline"
              >
                studentorgs@swarthmore.edu
              </a>{" "}
              and we will work with you to verify your request.
            </li>
            <li>
              If your club did not submit this information previously,
              we&apos;ve been contacting clubs by their listed email to ask
              for the names of people who need administrator permission. You
              can also email us at{" "}
              <a
                href="mailto:studentorgs@swarthmore.edu"
                className="font-medium text-sccs underline"
              >
                studentorgs@swarthmore.edu
              </a>{" "}
              and we will work with you to verify your request.
            </li>
          </ul>
          <p className="mt-3 text-base leading-7 text-foreground/90">
            Note that there are 2 levels of administrators: Officers and
            Owners. Officers are able to edit the page, invite other members,
            and grant administrator permissions. In addition to those
            abilities, Owners are able to deactivate or delete the club page.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            Why can&apos;t I find an organization on Swat Clubs?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            Sorry about that! We&apos;re in the process of making Swat Clubs
            as comprehensive as possible, creating the first complete
            directory of student organizations at Swarthmore College.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-foreground/90">
            <li>
              If you&apos;re an administrator of a club and it{" "}
              <strong>does not exist</strong> on Swat Clubs, you can add your
              club using the form found{" "}
              <Link href="/clubs" className="font-medium text-sccs underline">
                here
              </Link>
              .
            </li>
            <li>
              If you&apos;re an administrator of a club and it{" "}
              <strong>already exists</strong> on Swat Clubs, email{" "}
              <a
                href="mailto:studentorgs@swarthmore.edu"
                className="font-medium text-sccs underline"
              >
                studentorgs@swarthmore.edu
              </a>{" "}
              to gain edit access for your club.
            </li>
            <li>
              Otherwise, if you&apos;re not the administrator of the club but
              would still like for it to be added to Swat Clubs, please
              email{" "}
              <a
                href="mailto:studentorgs@swarthmore.edu"
                className="font-medium text-sccs underline"
              >
                studentorgs@swarthmore.edu
              </a>
              .
            </li>
          </ul>
          <p className="mt-3 text-base leading-7 text-foreground/90">
            If you have any questions about the club creation process, please
            email{" "}
            <a
              href="mailto:studentorgs@swarthmore.edu"
              className="font-medium text-sccs underline"
            >
              studentorgs@swarthmore.edu
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            Who is responsible for approving clubs on Swat Clubs?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            Newly created clubs require approval from the Office of Student
            Engagement in order to comply with college guidelines. When your
            club requires review, it will be added to a queue that is
            periodically checked by the Office of Student Engagement. You
            will be notified via email when your club has been reviewed.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-sccs">
            How are clubs ordered on Swat Clubs?
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            By default, clubs are shown in our recommended order. You can
            switch to alphabetical order, or sort by your bookmarks, using
            the Ordering filter on the Clubs page.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            I have another question!
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            <a
              href="mailto:sccs@sccs.swarthmore.edu"
              className="font-medium text-sccs underline"
            >
              Please let us know :)
            </a>
          </p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Special Thanks
          </h2>
          <p className="mt-2 text-base leading-7 text-foreground/90">
            Thank you to the organizations below for their support in
            launching Swat Clubs! We&apos;re excited to continue building
            this valuable resource together.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            <span>Student Council</span>
            <span>SCCS</span>
            <span>Office of Student Engagement</span>
            <span>Student Activities Committee</span>
          </div>
        </section>
      </div>

      <p className="mt-16 text-center text-sm text-muted-foreground">
        Made with ❤️ by SCCS
      </p>
    </div>
  );
}
