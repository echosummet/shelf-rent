import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { UnlinkIcon } from "~/components/icons";
import ContextualModal from "~/components/layout/contextual-modal";
import { Button } from "~/components/shared";
import { db } from "~/database";

import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { ShelfStackError } from "~/utils/error";
import { PermissionAction, PermissionEntity } from "~/utils/permissions";
import { requirePermision } from "~/utils/roles.server";

export const loader = async ({
  context,
  request,
  params,
}: LoaderFunctionArgs) => {
  const authSession = context.getSession();
  const { organizationId } = await requirePermision({
    userId: authSession.userId,
    request,
    entity: PermissionEntity.qr,
    action: PermissionAction.update,
  });
  const { qrId } = params;
  /** @TODO here we have to double check if the QR is orpaned, and if its not, redirect */

  const qr = await db.qr.findUnique({
    where: {
      id: qrId,
      organizationId,
    },
  });

  if (!qr) {
    throw new ShelfStackError({
      message: "This QR code doesn't belong to your current organization.",
      title: "Not allowed",
      status: 403,
    });
  }

  /** we check if its linked and if it was we just redirect back to qr page and let it handle the logic */
  if (qr.assetId) {
    return redirect(`/qr/${qrId}`);
  }

  return json({
    header: {
      title: "Link QR with asset",
    },
    qrId,
  });
};
export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: appendToMetaTitle(data?.header.title) },
];

export default function QrLink() {
  const { qrId } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="flex flex-1 justify-center py-8">
        <div className="my-auto">
          <div className="mb-4 inline-flex items-center justify-center rounded-full border-8 border-solid border-primary-50 bg-primary-100 p-2 text-primary">
            <UnlinkIcon />
          </div>
          <div className="mb-8">
            <h1 className="mb-2 text-[24px] font-semibold">Unlinked QR Code</h1>
            <p className="text-gray-600">
              This code is part of your Shelf environment but is not linked with
              an asset. Would you like to link it?
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <Button
              variant="primary"
              className=" max-w-full"
              to={`/assets/new?qrId=${qrId}`}
            >
              Create a new asset and link
            </Button>
            <Button
              variant="secondary"
              className=" max-w-full"
              to={`/qr/${qrId}/link-existing-asset`}
            >
              Link to existing asset
            </Button>
            <Button variant="secondary" className="max-w-full" to={"/"}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
      <ContextualModal />
    </>
  );
}
