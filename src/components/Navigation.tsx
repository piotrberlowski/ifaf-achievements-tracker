import Account from "@/components/Account";
import { getSession, isSystemAdmin } from "@/lib/session";
import { Bars3CenterLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default async function Navigation({ className }: { className?: string }) {
  const session = await getSession();
  const authenticated = !!session?.user.name;
  const showPermissions = await isSystemAdmin();

  const links = (
    <>
      <li>
        <Link href="/">Home</Link>
      </li>
      <li>
        <Link href="/records">Records</Link>
      </li>
      <li>
        <Link href="/gains">GAINS Thresholds</Link>
      </li>
      {showPermissions && (
        <li>
          <Link href="/admin">Permissions</Link>
        </li>
      )}
    </>
  );

  return (
    <div className={`navbar bg-neutral ${className ?? ""}`}>
      <div className="navbar-start text-neutral-content">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost ifaf-bar-control lg:hidden">
            <Bars3CenterLeftIcon className="h-4 w-4" />
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content z-[1] mt-3 w-52 rounded-box bg-base-300 p-2 text-base-content shadow menu-sm"
          >
            {links}
          </ul>
        </div>
        <Link className="btn btn-ghost ifaf-bar-control text-sm" href="/">
          IFAF
          <span className="m-0 hidden p-0 lg:inline"> Achievements</span>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal rounded-box bg-neutral-content/10 px-1 text-neutral-content">
          {links}
        </ul>
      </div>
      <div className="navbar-end text-neutral-content">
        {authenticated ? (
          <Account isAdmin={showPermissions} name={session?.user.name} />
        ) : (
          <Link className="btn btn-ghost ifaf-bar-control btn-sm" href="/login">
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
