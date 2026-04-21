import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function NotFound() {
  return (
    <article className="space-y-4">
      <Breadcrumb path="~/d/?" />
      <p className="text-sm">
        not a valid public domain. enter a bare FQDN like <code>example.com</code>. no IPs, no ports,
        no paths.
      </p>
    </article>
  );
}
