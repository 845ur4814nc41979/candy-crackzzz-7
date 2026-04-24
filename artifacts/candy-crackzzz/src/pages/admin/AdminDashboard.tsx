import { Link } from 'wouter';
import { Package, ShoppingCart, AlertCircle, DollarSign, Gift, Users } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SystemStatusCard from '@/components/admin/SystemStatusCard';

export default function AdminDashboard() {
  const { products, orders, settings, rewardProfiles } = useAppContext();

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'pending');
  const soldOutProducts = products.filter(p => p.isSoldOut);
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
  const referralOrders = orders.filter(o => !!o.referralCodeUsed).length;
  const referralPoints = rewardProfiles.reduce((sum, p) => sum + (p.lifetimeReferralPointsEarned ?? 0), 0);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground font-bold">Welcome back to mission control.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products/new">
            <Button className="font-bold uppercase"><Package className="w-4 h-4 mr-2" /> Add Product</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="secondary" className="font-bold uppercase">View Orders</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Orders</p>
              <h3 className="text-3xl font-black">{activeOrders.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/20 text-accent rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">New Requests</p>
              <h3 className="text-3xl font-black">{pendingOrders.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Products</p>
              <h3 className="text-3xl font-black">{products.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">All-Time Rev</p>
              <h3 className="text-3xl font-black">${totalRevenue.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
              <CardTitle className="font-black uppercase tracking-wider text-lg">Recent Orders</CardTitle>
              <Link href="/admin/orders" className="text-sm text-primary font-bold">View All</Link>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length > 0 ? (
                <div className="divide-y divide-border">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-bold">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.id} • {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`
                          ${order.status === 'new' ? 'bg-blue-500/20 text-blue-500 border-blue-500/50' : ''}
                          ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : ''}
                          ${order.status === 'confirmed' ? 'bg-green-500/20 text-green-500 border-green-500/50' : ''}
                          uppercase font-bold tracking-wider
                        `}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-bold mt-1">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground font-bold">No orders yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <SystemStatusCard />
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-black uppercase tracking-wider text-lg">Store Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground">Online Ordering</span>
                <Badge variant={settings.enableOrdering ? 'default' : 'destructive'} className="uppercase font-bold">
                  {settings.enableOrdering ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground">Delivery</span>
                <Badge variant={settings.enableDelivery ? 'default' : 'secondary'} className="uppercase font-bold">
                  {settings.enableDelivery ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground">Payments</span>
                <Badge variant={settings.enablePayments ? 'default' : 'destructive'} className="uppercase font-bold">
                  {settings.enablePayments ? 'Active' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-black uppercase tracking-wider text-lg">Rewards and Referrals</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground">Rewards Profiles</span>
                <span className="font-black">{rewardProfiles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground">Referral Orders</span>
                <span className="font-black text-secondary">{referralOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground">Referral Points</span>
                <span className="font-black">{referralPoints}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-background border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground mb-2"><Gift className="w-4 h-4" /> Rewards</div>
                  <div className="font-bold">{settings.enableRewards ? 'On' : 'Off'}</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground mb-2"><Users className="w-4 h-4" /> Referrals</div>
                  <div className="font-bold">{settings.enableReferrals ? 'On' : 'Off'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {soldOutProducts.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="border-b border-destructive/10 pb-4">
                <CardTitle className="font-black uppercase tracking-wider text-lg text-destructive flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Action Needed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-destructive/10">
                  {soldOutProducts.map(p => (
                    <div key={p.id} className="p-4 flex justify-between items-center">
                      <span className="font-bold">{p.name}</span>
                      <Badge variant="destructive" className="uppercase font-bold">Sold Out</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
