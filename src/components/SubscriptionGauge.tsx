import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Mail } from 'lucide-react';
import { dataService } from '../services/dataService';
import 'react-circular-progressbar/dist/styles.css';

const SubscriptionGauge = () => {
  const [subscriptionData, setSubscriptionData] = useState({ subscribed: 0, unsubscribed: 0, percentage: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const retailers = await dataService.getRetailers();
        const subscribed = retailers.filter(r => r.email_marketing === 'Subscribed').length;
        const unsubscribed = retailers.filter(r => r.email_marketing === 'Unsubscribed').length;
        const total = subscribed + unsubscribed;
        const percentage = total > 0 ? (subscribed / total) * 100 : 0;

        setSubscriptionData({ subscribed, unsubscribed, percentage });
      } catch (error) {
        console.error('Failed to load subscription data:', error);
      }
    };

    loadData();
    
    const handleDataChange = () => loadData();
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Email Marketing</span>
        </CardTitle>
        <p className="text-sm text-gray-600">Newsletter subscription status</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="w-32 h-32">
            <CircularProgressbar
              value={subscriptionData.percentage}
              text={`${Math.round(subscriptionData.percentage)}%`}
              styles={buildStyles({
                textColor: 'var(--theme-primary, #228B22)',
                pathColor: 'var(--theme-primary, #228B22)',
                trailColor: 'var(--theme-secondary, #f3f4f6)',
                textSize: '16px',
              })}
            />
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Subscribed:</span>
            <span className="font-medium text-green-600">{subscriptionData.subscribed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Unsubscribed:</span>
            <span className="font-medium text-red-600">{subscriptionData.unsubscribed}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-sm font-medium">Total:</span>
            <span className="font-medium">{subscriptionData.subscribed + subscriptionData.unsubscribed}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionGauge;
