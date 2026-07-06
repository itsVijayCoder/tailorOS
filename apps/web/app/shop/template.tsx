export default function ShopTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="route-shell">{children}</div>;
}
